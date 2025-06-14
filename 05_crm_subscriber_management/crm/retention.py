"""Utilities for re-engaging inactive subscribers."""

from pathlib import Path
import sys
from datetime import datetime, timedelta
from sqlmodel import select

if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    __package__ = "crm"

from .db import get_session
from .models import Subscriber, MessageLog
from .email_utils import send_email
from .onboarding import personalize

BASE_DIR = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = BASE_DIR / "message_templates"

def load_retention_template():
    """Return the retention offer template as text."""
    path = TEMPLATES_DIR / "retention_offer.md"
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"Retention template not found at {path}") from None
    except OSError as exc:
        raise RuntimeError(f"Unable to read retention template: {exc}") from exc

def send_retention_offer(sub, session):
    """Send the retention email to a subscriber and log it."""
    template = load_retention_template()
    message = personalize(template, {"name": sub.username})
    subject = "We miss you on OnlyFans!"
    resp = send_email(sub.email, subject, message)
    log = MessageLog(subscriber_id=sub.id, message="Retention email sent.")
    session.add(log)
    session.commit()
    return resp

def run_retention():
    """Send retention offers to subscribers inactive for over a week."""
    session = get_session()
    cutoff = datetime.utcnow() - timedelta(days=7)

    stmt = select(Subscriber).where(
        Subscriber.last_active != None,
        Subscriber.last_active < cutoff
    )
    inactive_subs = session.exec(stmt).all()

    for sub in inactive_subs:
        try:
            send_retention_offer(sub, session)
            print(f"[{datetime.utcnow()}] Email sent to {sub.email}")
        except Exception as e:
            print(f"[{datetime.utcnow()}] Failed to send to {sub.email}: {str(e)}")

if __name__ == "__main__":
    run_retention()
