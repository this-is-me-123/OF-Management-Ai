import os
import json
from datetime import datetime

LOG_PATH = os.path.join(os.path.dirname(__file__), "../logs/message_log.jsonl")

def log_message(username, tier, message_type, message):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "username": username,
        "tier": tier,
        "type": message_type,
        "message": message
    }
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(log_entry) + "\n")
