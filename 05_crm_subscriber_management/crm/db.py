"""Database utilities for the CRM module."""

import json
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session
from .models import Subscriber

load_dotenv()

DB_FILE = Path(__file__).resolve().parents[1] / 'data' / 'subscribers_db.json'
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./crm.db")

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


def get(sub_id: int):
    """Retrieve a subscriber record by ID."""
    if _use_sql:
        with get_session() as session:
            return session.get(Subscriber, sub_id)
    data = _load()
    return data.get(str(sub_id))


def update(sub_id: int, info: dict):
    """Update a subscriber record with the provided data."""
    if _use_sql:
        with get_session() as session:
            sub = session.get(Subscriber, sub_id)
            if not sub:
                raise ValueError(f"Subscriber {sub_id} not found")
            for key, value in info.items():
                if hasattr(sub, key):
                    setattr(sub, key, value)
            session.add(sub)
            session.commit()
            return sub
    data = _load()
    existing = data.get(str(sub_id), {})
    existing.update(info)
    data[str(sub_id)] = existing
    _save(data)
    return existing
