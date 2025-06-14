"""Process subscriber events and trigger CRM workflows."""
import json
from pathlib import Path
import sys
import argparse

if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    __package__ = "crm"

from . import db, messaging
from .onboarding import onboard_user, load_tiers, assign_tier
from .retention import send_retention_offer

BASE_DIR = Path(__file__).resolve().parents[1]
EVENTS_FILE = BASE_DIR / 'data' / 'sample_events.json'


def process_events(events_file: Path = EVENTS_FILE):
    """Read subscriber events from ``events_file`` and trigger workflows."""
    try:
        with open(events_file, 'r', encoding='utf-8') as f:
            events = json.load(f).get('events', [])
    except FileNotFoundError as exc:
        raise SystemExit(f"[process_events] File not found: {events_file}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"[process_events] Invalid JSON in {events_file}: {exc}") from exc
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
            messaging.send_message(user['name'], message)


def main() -> None:
    parser = argparse.ArgumentParser(description="Process event file")
    parser.add_argument('--file', type=str, default=str(EVENTS_FILE),
                        help='Path to events JSON')
    args = parser.parse_args()

    process_events(Path(args.file))


if __name__ == '__main__':
    main()
