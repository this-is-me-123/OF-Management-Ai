"""Process subscriber events and trigger CRM workflows."""
import json
from pathlib import Path
import sys

if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    __package__ = "crm"

from . import db
from .onboarding import onboard_user, load_tiers, assign_tier
from .retention import send_retention_offer
from .messaging import send_message

BASE_DIR = Path(__file__).resolve().parents[1]
EVENTS_FILE = BASE_DIR / 'data' / 'sample_events.json'


def process_events():
    with open(EVENTS_FILE, 'r') as f:
        events = json.load(f).get('events', [])

    for event in events:
        user = event['subscriber']
        if event['event'] == 'new':
            onboard_user(user)
        elif event['event'] == 'inactive':
            send_retention_offer(user)
        elif event['event'] == 'upgrade':
            tiers = load_tiers()
            tier = assign_tier(user, tiers)
            message = f"Thanks for upgrading! Enjoy your new perks, {user['name']}!"
            record = user.copy()
            record['tier'] = tier
            db.update(user['id'], record)
            send_message(user['name'], message)


if __name__ == '__main__':
    process_events()
