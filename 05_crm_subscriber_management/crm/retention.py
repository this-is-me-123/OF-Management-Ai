# retention.py

from datetime import datetime, timedelta
from sqlmodel import select
from db import get_session
from models import Subscriber, MessageLog
from email_utils import send_email

def run_retention():
    """
    Finds subscribers whose last_active is more than 7 days ago,
    sends them a re-engagement email, and logs the message.
    """
    session = get_session()
    cutoff = datetime.utcnow() - timedelta(days=7)
    # Select inactive subscribers
    stmt = select(Subscriber).where(
        Subscriber.last_active != None,
        Subscriber.last_active < cutoff
    )
    inactive_subs = session.exec(stmt).all()

    for sub in inactive_subs:
        subject = "We miss you on OnlyFans!"
        content = (
            f"Hi {sub.username},\n\n"
            "It's been a while since we've seen you. "
            "Check out our latest content and come say hi!\n\n"
            "– Your OnlyFans Team"
        )
        try:
            resp = send_email(sub.email, subject, content)
            # Log success
            log = MessageLog(subscriber_id=sub.id, message=f"Retention email sent.")
            session.add(log)
            session.commit()
            print(f"[{datetime.utcnow()}] Email sent to {sub.email}")
        except Exception as e:
            print(f"[{datetime.utcnow()}] Failed to send to {sub.email}: {str(e)}")
