# db.py

import os
from dotenv import load_dotenv
load_dotenv()

from sqlmodel import SQLModel, create_engine, Session

from .models import Subscriber

# If you’re using Supabase, DATABASE_URL should include your Postgres credentials
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./crm.db")

# Enforce SSL when connecting to Postgres
engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"sslmode": "require"}
)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    return Session(engine)


def update(sub_id: int, data: dict):
    """Update a subscriber record with the provided data."""
    with get_session() as session:
        sub = session.get(Subscriber, sub_id)
        if not sub:
            raise ValueError(f"Subscriber {sub_id} not found")
        for key, value in data.items():
            if hasattr(sub, key):
                setattr(sub, key, value)
        session.add(sub)
        session.commit()
        return sub
