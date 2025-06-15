"""Send churn warning emails to long inactive subscribers."""

from datetime import datetime, timedelta
from pathlib import Path
from sqlmodel import select

from .db import get_session
from .models import Subscriber, MessageLog
from .email_utils import send_email
from .onboarding import personalize

BASE_DIR = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = BASE_DIR / "message_templates"


def load_churn_template():
    path = TEMPLATES_DIR / "churn_warning_followup.txt"
    with open(path, encoding="utf-8") as f:
        return f.read()


def send_churn_warning(sub, session):
    template = load_churn_template()
    message = personalize(template, {"name": sub.username})
    send_email(sub.email, "We're sorry to see you go", message)
    sub.is_active = False
    session.add(sub)
    session.add(MessageLog(subscriber_id=sub.id, message="Churn warning sent"))
    session.commit()


def run_churn():
    """Send churn warnings to subscribers inactive for over 30 days."""
    session = get_session()
    cutoff = datetime.utcnow() - timedelta(days=30)
    stmt = select(Subscriber).where(
        Subscriber.last_active != None,
        Subscriber.last_active < cutoff,
        Subscriber.is_active == True,
    )
    subs = session.exec(stmt).all()
    for sub in subs:
        try:
            send_churn_warning(sub, session)
            print(f"Churn warning sent to {sub.email}")
        except Exception as exc:
            print(f"Failed to send to {sub.email}: {exc}")


if __name__ == "__main__":
    run_churn()
