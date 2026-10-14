from pathlib import Path
import sqlite3


DB_PATH = Path(__file__).resolve().with_name("chat.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id TEXT,
            title TEXT NOT NULL DEFAULT '새 대화',
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )
    """)

    columns = {row["name"] for row in conn.execute("PRAGMA table_info(sessions)")}
    if "owner_id" not in columns:
        conn.execute("ALTER TABLE sessions ADD COLUMN owner_id TEXT")

    # 기존에는 모든 방문자가 같은 세션을 공유했으므로, 소유자를 알 수 없는
    # 레거시 대화는 새 사용자에게 노출되지 않도록 마이그레이션 시 제거합니다.
    conn.execute("DELETE FROM sessions WHERE owner_id IS NULL OR owner_id = ''")

    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )
    """)
    conn.commit()
    conn.close()


def create_session(owner_id):
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO sessions (owner_id) VALUES (?)", (owner_id,)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def read_sessions(owner_id):
    conn = get_conn()
    rows = conn.execute(
        "SELECT id, title, created_at FROM sessions "
        "WHERE owner_id = ? ORDER BY id DESC",
        (owner_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def session_exists(session_id, owner_id):
    conn = get_conn()
    row = conn.execute(
        "SELECT 1 FROM sessions WHERE id = ? AND owner_id = ?",
        (session_id, owner_id),
    ).fetchone()
    conn.close()
    return row is not None


def create_message(session_id, role, text):
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO messages (session_id, role, text) VALUES (?, ?, ?)",
        (session_id, role, text),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def read_message(session_id, owner_id):
    conn = get_conn()
    rows = conn.execute(
        "SELECT messages.id, messages.role, messages.text, messages.created_at "
        "FROM messages JOIN sessions ON sessions.id = messages.session_id "
        "WHERE messages.session_id = ? AND sessions.owner_id = ? "
        "ORDER BY messages.id",
        (session_id, owner_id),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def count_message(session_id, owner_id):
    conn = get_conn()
    row = conn.execute(
        "SELECT COUNT(*) AS n FROM messages "
        "JOIN sessions ON sessions.id = messages.session_id "
        "WHERE messages.session_id = ? AND sessions.owner_id = ?",
        (session_id, owner_id),
    ).fetchone()
    conn.close()
    return row["n"]


def update_session(session_id, owner_id, title):
    conn = get_conn()
    cur = conn.execute(
        "UPDATE sessions SET title = ? WHERE id = ? AND owner_id = ?",
        (title, session_id, owner_id),
    )
    conn.commit()
    changed = cur.rowcount
    conn.close()
    return changed


def delete_session(session_id, owner_id):
    conn = get_conn()
    cur = conn.execute(
        "DELETE FROM sessions WHERE id = ? AND owner_id = ?",
        (session_id, owner_id),
    )
    conn.commit()
    changed = cur.rowcount
    conn.close()
    return changed
