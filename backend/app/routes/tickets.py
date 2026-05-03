from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from app.config.database import get_connection
from app.middleware.auth import get_current_user, require_role
from app.utils.qr_utils import generate_secure_token, generate_qr_data_url
import uuid

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

class PurchaseBody(BaseModel):
    event_id: str

class ValidateBody(BaseModel):
    token: str
    ticketId: str

class ResellBody(BaseModel):
    to_email: str

# ── Purchase ───────────────────────────────────────────────────────────────────
@router.post("/purchase", status_code=201)
def purchase_ticket(body: PurchaseBody, user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        conn.start_transaction()

        cursor.execute("SELECT * FROM events WHERE id = %s FOR UPDATE", (body.event_id,))
        event = cursor.fetchone()
        if not event:
            conn.rollback()
            raise HTTPException(404, "Event not found")

        cursor.execute(
            "SELECT COUNT(*) AS cnt FROM tickets WHERE event_id = %s AND status != 'void'",
            (body.event_id,)
        )
        if cursor.fetchone()["cnt"] >= event["total_tickets"]:
            conn.rollback()
            raise HTTPException(409, "Event is sold out")

        cursor.execute(
            "SELECT id FROM tickets WHERE event_id = %s AND owner_id = %s AND status != 'void'",
            (body.event_id, user["id"])
        )
        if cursor.fetchone():
            conn.rollback()
            raise HTTPException(409, "You already have a ticket for this event")

        ticket_id = str(uuid.uuid4())
        token, expires = generate_secure_token(ticket_id)

        cursor.execute("""
            INSERT INTO tickets (id, event_id, owner_id, secure_token, token_expires, purchase_price)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (ticket_id, body.event_id, user["id"], token, expires, event["price"]))
        conn.commit()

        cursor.execute("SELECT * FROM tickets WHERE id = %s", (ticket_id,))
        return {"ticket": cursor.fetchone()}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, f"Purchase failed: {e}")
    finally:
        cursor.close(); conn.close()

# ── My Tickets ─────────────────────────────────────────────────────────────────
@router.get("/mine")
def my_tickets(user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT t.*, e.title AS event_title, e.location, e.starts_at, e.ends_at
            FROM tickets t JOIN events e ON e.id = t.event_id
            WHERE t.owner_id = %s ORDER BY e.starts_at DESC
        """, (user["id"],))
        return {"tickets": cursor.fetchall()}
    finally:
        cursor.close(); conn.close()

# ── Get QR ─────────────────────────────────────────────────────────────────────
@router.get("/{ticket_id}/qr")
def get_ticket_qr(ticket_id: str, user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM tickets WHERE id = %s AND owner_id = %s", (ticket_id, user["id"])
        )
        ticket = cursor.fetchone()
        if not ticket:
            raise HTTPException(404, "Ticket not found")
        if ticket["status"] == "used":
            raise HTTPException(410, "Ticket already used")
        if ticket["status"] == "void":
            raise HTTPException(410, "Ticket is void")

        token = ticket["secure_token"]
        expires = ticket["token_expires"]

        # Auto-rotate if expired
        if expires <= datetime.utcnow():
            token, expires = generate_secure_token(ticket_id)
            cursor.execute(
                "UPDATE tickets SET secure_token = %s, token_expires = %s WHERE id = %s",
                (token, expires, ticket_id)
            )
            conn.commit()

        qr = generate_qr_data_url(token, ticket_id)
        seconds_left = max(0, int((expires - datetime.utcnow()).total_seconds()))
        return {"qrDataURL": qr, "token_expires": expires, "secondsLeft": seconds_left}
    finally:
        cursor.close(); conn.close()

# ── Rotate Token ───────────────────────────────────────────────────────────────
@router.post("/{ticket_id}/rotate")
def rotate_token(ticket_id: str, user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM tickets WHERE id = %s AND owner_id = %s", (ticket_id, user["id"])
        )
        ticket = cursor.fetchone()
        if not ticket:
            raise HTTPException(404, "Ticket not found")
        if ticket["status"] != "active":
            raise HTTPException(400, "Ticket not active")

        token, expires = generate_secure_token(ticket_id)
        cursor.execute(
            "UPDATE tickets SET secure_token = %s, token_expires = %s WHERE id = %s",
            (token, expires, ticket_id)
        )
        conn.commit()
        qr = generate_qr_data_url(token, ticket_id)
        return {"qrDataURL": qr, "token_expires": expires}
    finally:
        cursor.close(); conn.close()

# ── Validate (Scanner) ─────────────────────────────────────────────────────────
@router.post("/validate")
def validate_ticket(body: ValidateBody, user=Depends(require_role("organizer", "admin", "scanner"))):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT t.*, e.title AS event_title, u.name AS owner_name
            FROM tickets t
            JOIN events e ON e.id = t.event_id
            JOIN users  u ON u.id = t.owner_id
            WHERE t.id = %s
        """, (body.ticketId,))
        ticket = cursor.fetchone()

        def log(tid, result):
            try:
                cursor.execute(
                    "INSERT INTO scan_log (id, ticket_id, scanned_by, result) VALUES (%s,%s,%s,%s)",
                    (str(uuid.uuid4()), tid, user["id"], result)
                )
                conn.commit()
            except: pass

        if not ticket:
            log(None, "invalid")
            return {"result": "invalid", "reason": "Ticket not found"}
        if ticket["status"] == "used":
            log(ticket["id"], "already_used")
            return {"result": "already_used", "reason": "Ticket was already scanned", "ticket": ticket}
        if ticket["status"] == "void":
            log(ticket["id"], "invalid")
            return {"result": "invalid", "reason": "Ticket is void", "ticket": ticket}
        if ticket["secure_token"] != body.token:
            log(ticket["id"], "invalid")
            return {"result": "invalid", "reason": "Token mismatch — QR may be expired", "ticket": ticket}
        if ticket["token_expires"] < datetime.utcnow():
            log(ticket["id"], "invalid")
            return {"result": "invalid", "reason": "QR code expired — ask holder to refresh", "ticket": ticket}

        cursor.execute(
            "UPDATE tickets SET status = 'used', used_at = NOW() WHERE id = %s", (ticket["id"],)
        )
        conn.commit()
        log(ticket["id"], "valid")
        return {"result": "valid", "ticket": {**ticket, "status": "used"}}
    finally:
        cursor.close(); conn.close()

# ── Resell ─────────────────────────────────────────────────────────────────────
@router.post("/{ticket_id}/resell")
def resell_ticket(ticket_id: str, body: ResellBody, user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        conn.start_transaction()

        cursor.execute("""
            SELECT t.*, e.resale_allowed, e.price AS face_price
            FROM tickets t JOIN events e ON e.id = t.event_id
            WHERE t.id = %s AND t.owner_id = %s FOR UPDATE
        """, (ticket_id, user["id"]))
        ticket = cursor.fetchone()
        if not ticket:
            conn.rollback(); raise HTTPException(404, "Ticket not found")
        if not ticket["resale_allowed"]:
            conn.rollback(); raise HTTPException(403, "Resale not allowed for this event")
        if ticket["status"] != "active":
            conn.rollback(); raise HTTPException(400, "Only active tickets can be resold")

        cursor.execute("SELECT id FROM users WHERE email = %s", (body.to_email.lower(),))
        new_owner = cursor.fetchone()
        if not new_owner:
            conn.rollback(); raise HTTPException(404, "Buyer not found — they must register first")

        token, expires = generate_secure_token(ticket_id)
        cursor.execute("""
            UPDATE tickets
            SET owner_id = %s, secure_token = %s, token_expires = %s,
                status = 'active', transfer_count = transfer_count + 1
            WHERE id = %s
        """, (new_owner["id"], token, expires, ticket_id))

        cursor.execute("""
            INSERT INTO ticket_transfers (id, ticket_id, from_user, to_user, sale_price)
            VALUES (%s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), ticket_id, user["id"], new_owner["id"], ticket["purchase_price"]))

        conn.commit()
        return {"message": "Ticket transferred successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, f"Transfer failed: {e}")
    finally:
        cursor.close(); conn.close()
