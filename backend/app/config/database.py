import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
import os

load_dotenv()

# ── Connection pool ────────────────────────────────────────────────────────────
db_config = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 3306)),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "ticketflow"),
}

connection_pool = pooling.MySQLConnectionPool(
    pool_name="ticketflow_pool",
    pool_size=10,
    **db_config
)

def get_connection():
    return connection_pool.get_connection()

def test_connection():
    try:
        conn = get_connection()
        conn.close()
        print("MySQL connected")
    except Exception as e:
        print(f"MySQL connection error: {e}")
        raise

# ── Migrations ─────────────────────────────────────────────────────────────────
def run_migrations():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # USERS
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id          VARCHAR(36)  PRIMARY KEY,
                email       VARCHAR(255) UNIQUE NOT NULL,
                password    VARCHAR(255) NOT NULL,
                name        VARCHAR(255) NOT NULL,
                role        VARCHAR(50)  NOT NULL DEFAULT 'buyer',
                created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # EVENTS
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id              VARCHAR(36)    PRIMARY KEY,
                organizer_id    VARCHAR(36),
                title           VARCHAR(255)   NOT NULL,
                description     TEXT,
                location        VARCHAR(255),
                starts_at       DATETIME       NOT NULL,
                ends_at         DATETIME,
                total_tickets   INT            NOT NULL DEFAULT 100,
                price           DECIMAL(10,2)  NOT NULL DEFAULT 0,
                resale_allowed  TINYINT(1)     DEFAULT 0,
                resale_markup   DECIMAL(5,2)   DEFAULT 0,
                created_at      DATETIME       DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # TICKETS
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id              VARCHAR(36)   PRIMARY KEY,
                event_id        VARCHAR(36),
                owner_id        VARCHAR(36),
                secure_token    VARCHAR(512)  UNIQUE NOT NULL,
                token_expires   DATETIME      NOT NULL,
                status          VARCHAR(50)   NOT NULL DEFAULT 'active',
                used_at         DATETIME,
                purchase_price  DECIMAL(10,2),
                transfer_count  INT           DEFAULT 0,
                created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES users(id)  ON DELETE SET NULL
            )
        """)

        # TICKET TRANSFERS
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ticket_transfers (
                id              VARCHAR(36)   PRIMARY KEY,
                ticket_id       VARCHAR(36),
                from_user       VARCHAR(36),
                to_user         VARCHAR(36),
                sale_price      DECIMAL(10,2),
                transferred_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                FOREIGN KEY (from_user) REFERENCES users(id),
                FOREIGN KEY (to_user)   REFERENCES users(id)
            )
        """)

        # SCAN LOG
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scan_log (
                id          VARCHAR(36)  PRIMARY KEY,
                ticket_id   VARCHAR(36),
                scanned_by  VARCHAR(36),
                result      VARCHAR(50)  NOT NULL,
                scanned_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id)  REFERENCES tickets(id),
                FOREIGN KEY (scanned_by) REFERENCES users(id)
            )
        """)

        conn.commit()
        print("Migrations complete")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()
