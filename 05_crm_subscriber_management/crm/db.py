"""Database utilities for the CRM module."""

import json
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

load_dotenv()

DB_FILE = Path(__file__).resolve().parents[1] / 'data' / 'subscribers_db.json'
DATABASE_URL = os.environ.get("DATABASE_URL")

_use_sql = DATABASE_URL not in (None, "json")

if _use_sql:
    connect_args = {"sslmode": "require"} if DATABASE_URL.startswith("postgres") else {}
    engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)
else:
    engine = None


def _load():
    if DB_FILE.exists():
        try:
            with open(DB_FILE, encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: DB file {DB_FILE} is corrupted. Re-initialising.")
            return {}
    return {}


def _save(data):
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)


def init_db():
    """Create tables for SQL backends or initialise the JSON store."""
    if _use_sql:
        SQLModel.metadata.create_all(engine)
    else:
        _save(_load())


def get_session() -> Session:
    if not _use_sql:
        raise RuntimeError("JSON DB does not support sessions")
    return Session(engine)


def get(user_id):
    """Retrieve a subscriber record when using the JSON backend."""
    if _use_sql:
        raise RuntimeError("Use SQLModel sessions with the SQL backend")
    data = _load()
    return data.get(str(user_id))


def update(user_id, info):
    """Update a subscriber record when using the JSON backend."""
    if _use_sql:
        raise RuntimeError("Use SQLModel sessions with the SQL backend")
    data = _load()
    existing = data.get(str(user_id), {})
    existing.update(info)
    data[str(user_id)] = existing
    _save(data)
    return existing
