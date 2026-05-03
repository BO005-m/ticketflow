from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from app.config.database import get_connection
from app.utils.jwt_utils import sign_token
from app.middleware.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterBody(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "buyer"

class LoginBody(BaseModel):
    email: EmailStr
    password: str

class UpdateProfileBody(BaseModel):
    name: str

class ChangePasswordBody(BaseModel):
    old_password: str
    new_password: str

@router.post("/register", status_code=201)
def register(body: RegisterBody):
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    allowed = ["buyer", "organizer"]
    role = body.role if body.role in allowed else "buyer"
    hashed = pwd.hash(body.password)
    user_id = str(uuid.uuid4())

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO users (id, email, password, name, role) VALUES (%s, %s, %s, %s, %s)",
            (user_id, body.email.lower(), hashed, body.name.strip(), role)
        )
        conn.commit()
        cursor.execute(
            "SELECT id, email, name, role, created_at FROM users WHERE id = %s", (user_id,)
        )
        user = cursor.fetchone()
        token = sign_token({"id": user["id"], "role": user["role"]})
        return {"token": token, "user": user}
    except Exception as e:
        conn.rollback()
        if "Duplicate entry" in str(e):
            raise HTTPException(409, "Email already registered")
        raise HTTPException(500, "Registration failed")
    finally:
        cursor.close()
        conn.close()

@router.post("/login")
def login(body: LoginBody):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (body.email.lower(),))
        user = cursor.fetchone()
        if not user or not pwd.verify(body.password, user["password"]):
            raise HTTPException(401, "Invalid credentials")
        token = sign_token({"id": user["id"], "role": user["role"]})
        user.pop("password")
        return {"token": token, "user": user}
    finally:
        cursor.close()
        conn.close()

@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"user": user}

@router.put("/profile")
def update_profile(body: UpdateProfileBody, user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "UPDATE users SET name = %s WHERE id = %s",
            (body.name.strip(), user["id"])
        )
        conn.commit()
        user["name"] = body.name.strip()
        return {"user": user, "message": "Profile updated"}
    finally:
        cursor.close()
        conn.close()

@router.post("/change-password")
def change_password(body: ChangePasswordBody, user_data=Depends(get_current_user)):
    if len(body.new_password) < 8:
        raise HTTPException(400, "New password must be at least 8 characters")
        
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT password FROM users WHERE id = %s", (user_data["id"],))
        user = cursor.fetchone()
        
        if not pwd.verify(body.old_password, user["password"]):
            raise HTTPException(401, "Invalid old password")
            
        hashed = pwd.hash(body.new_password)
        cursor.execute(
            "UPDATE users SET password = %s WHERE id = %s",
            (hashed, user_data["id"])
        )
        conn.commit()
        return {"message": "Password updated successfully"}
    finally:
        cursor.close()
        conn.close()

@router.post("/logout")
def logout(user=Depends(get_current_user)):
    # With JWT, logout is usually handled client-side by deleting the token.
    # Optionally, we could add the token to a blacklist here.
    return {"message": "Logged out successfully"}

@router.delete("/account")
def delete_account(user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s", (user["id"],))
        conn.commit()
        return {"message": "Account deleted successfully"}
    finally:
        cursor.close()
        conn.close()
