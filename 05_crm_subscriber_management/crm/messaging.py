"""Utility to log CRM messages."""
from pathlib import Path

LOG_FILE = Path(__file__).resolve().parents[1] / 'crm_logs.txt'


def send_message(user_name: str, message: str) -> str:
    """Append a CRM message to the log file and print it."""
    entry = f"{user_name}: {message}"
    with open(LOG_FILE, 'a') as f:
        f.write(entry + "\n")
    print(entry)
    return entry
