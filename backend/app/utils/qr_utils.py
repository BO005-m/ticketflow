import hmac
import hashlib
import os
import secrets
import base64
import qrcode
import json
from io import BytesIO
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SECRET           = os.getenv("JWT_SECRET", "").encode()
ROTATION_SECONDS = int(os.getenv("QR_ROTATION_SECONDS", 30))

def generate_secure_token(ticket_id: str) -> tuple[str, datetime]:
    """Returns (token, expires_at)"""
    rand      = secrets.token_hex(32)
    signature = hmac.new(SECRET, f"{ticket_id}:{rand}".encode(), hashlib.sha256).hexdigest()
    token     = f"{ticket_id}.{signature}"
    expires   = datetime.utcnow() + timedelta(seconds=ROTATION_SECONDS)
    return token, expires

def generate_qr_data_url(token: str, ticket_id: str) -> str:
    """Generate QR code as base64 PNG data URL"""
    payload = json.dumps({"token": token, "ticketId": ticket_id})
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{b64}"
