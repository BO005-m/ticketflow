from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.config.database import test_connection, run_migrations
from app.routes import auth, events, tickets

load_dotenv()

app = FastAPI(title="TicketFlow API", version="1.0.0")

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(tickets.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}

# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    test_connection()
    run_migrations()
    print(f"TicketFlow API running on port {os.getenv('PORT', 4000)}")
