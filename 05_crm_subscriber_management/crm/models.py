from typing import Optional, List
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
