"""Utility to log CRM messages."""
from pathlib import Path
import logging

LOG_FILE = Path(__file__).resolve().parents[1] / 'crm_logs.txt'

# Configure a simple file logger for CRM messages
logger = logging.getLogger(__name__)
if not logger.handlers:
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler(LOG_FILE)
    handler.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(handler)


def send_message(user_name: str, message: str) -> str:
    """Append a CRM message to the log file and log it."""
    entry = f"{user_name}: {message}"
    with open(LOG_FILE, 'a') as f:
        f.write(entry + "\n")
    logger.info(entry)
    return entry
