"""Simple JSON-based subscriber database."""
import json
from pathlib import Path

DB_FILE = Path(__file__).resolve().parents[1] / 'data' / 'subscribers_db.json'


def _load():
    if DB_FILE.exists():
        try:
            with open(DB_FILE, encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            # Recover by starting from an empty DB instead of crashing
            print(f"Warning: DB file {DB_FILE} is corrupted. Re-initialising.")
            return {}
    return {}

def _save(data):
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def get(user_id):
    data = _load()
    return data.get(str(user_id))


def update(user_id, info):
    data = _load()
    existing = data.get(str(user_id), {})
    existing.update(info)
    data[str(user_id)] = existing
    _save(data)
    return existing
