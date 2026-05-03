from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.config.database import get_connection
from app.middleware.auth import get_current_user, require_role
import uuid

router = APIRouter(prefix="/api/events", tags=["events"])

class EventBody(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    total_tickets: int
    price: float
    resale_allowed: bool = False
    resale_markup: float = 0

@router.get("")
def list_events():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT e.*, u.name AS organizer_name,
              (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.status != 'void') AS sold_count
            FROM events e
            JOIN users u ON u.id = e.organizer_id
            WHERE e.starts_at > NOW()
            ORDER BY e.starts_at ASC
            LIMIT 50
        """)
        return {"events": cursor.fetchall()}
    finally:
        cursor.close(); conn.close()

@router.get("/mine")
def my_events(user=Depends(require_role("organizer", "admin"))):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT e.*,
              (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.status != 'void') AS sold_count
            FROM events e WHERE e.organizer_id = %s
            ORDER BY e.starts_at DESC
        """, (user["id"],))
        return {"events": cursor.fetchall()}
    finally:
        cursor.close(); conn.close()

@router.get("/{event_id}")
def get_event(event_id: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT e.*, u.name AS organizer_name FROM events e
            JOIN users u ON u.id = e.organizer_id WHERE e.id = %s
        """, (event_id,))
        event = cursor.fetchone()
        if not event:
            raise HTTPException(404, "Event not found")
        return {"event": event}
    finally:
        cursor.close(); conn.close()

@router.post("", status_code=201)
def create_event(body: EventBody, user=Depends(require_role("organizer", "admin"))):
    event_id = str(uuid.uuid4())
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO events
              (id, organizer_id, title, description, location, starts_at, ends_at,
               total_tickets, price, resale_allowed, resale_markup)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (event_id, user["id"], body.title, body.description, body.location,
              body.starts_at, body.ends_at, body.total_tickets, body.price,
              1 if body.resale_allowed else 0, body.resale_markup))
        conn.commit()
        cursor.execute("SELECT * FROM events WHERE id = %s", (event_id,))
        return {"event": cursor.fetchone()}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        cursor.close(); conn.close()
