"""SQLModel definitions for the CRM database."""

from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class Subscriber(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    email: str
    phone: Optional[str] = None
    tier: str = "free"
    is_active: bool = True
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: Optional[datetime] = None
    tags: Optional[str] = None

class MessageLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subscriber_id: int = Field(foreign_key="subscriber.id")
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    message: str


class SegmentRule(SQLModel, table=True):
    """Segmentation rule stored as JSON."""

    id: Optional[int] = Field(default=None, primary_key=True)
    segment: str
    rule_json: str


class TierDefinition(SQLModel, table=True):
    """Subscriber tier definition stored in the DB."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    criteria: str
