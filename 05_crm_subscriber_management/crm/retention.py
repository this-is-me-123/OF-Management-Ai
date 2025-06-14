"""Send retention offers to inactive subscribers."""
from pathlib import Path
import sys

if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    __package__ = "crm"

from . import db, messaging
from .onboarding import load_rules, assign_segment, personalize

BASE_DIR = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = BASE_DIR / 'message_templates'


def load_retention_template():
    path = TEMPLATES_DIR / 'retention_offer.md'
    with open(path, 'r') as f:
        return f.read()


def send_retention_offer(user):
    """Send a retention message if the user matches the At-Risk segment."""
    rules = load_rules()
    segment = assign_segment(user, rules)
    if segment != 'At-Risk':
        print(f"User {user.get('name')} is not at risk (segment: {segment}).")
        return None

    template = load_retention_template()
    message = personalize(template, user)
    record = user.copy()
    record.update({'segment': segment})
    db.update(user['id'], record)
    return messaging.send_message(user['name'], message)


if __name__ == '__main__':
    demo_user = {
        'id': 2,
        'name': 'Bob',
        'days_subscribed': 30,
        'no_activity_days': 15,
        'total_spend': 10,
    }
    send_retention_offer(demo_user)
