"""Process sample CRM events and trigger workflows."""

import json
from pathlib import Path
import argparse

from onboarding import onboard_user
from retention import run_retention
from churn import run_churn

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"


def load_events(path: Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def process_events(events):
    for event in events:
        etype = event.get("type")
        if etype == "new_subscription":
            onboard_user(event)
        elif etype == "inactivity":
            run_retention()
        elif etype == "churn_check":
            run_churn()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=DATA_DIR / "sample_events.json")
    args = parser.parse_args()
    events = load_events(args.file)
    process_events(events)


if __name__ == "__main__":
    main()
