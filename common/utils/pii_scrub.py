import re
from typing import Iterable, Dict, List

PHONE_PATTERN = re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b")
HANDLE_PATTERN = re.compile(r"@\w+")
# Simplistic name pattern: capitalized words at least 3 letters
NAME_PATTERN = re.compile(r"\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b")


def scrub_text(text: str) -> str:
    """Remove common PII like phone numbers, social handles, and names."""
    text = PHONE_PATTERN.sub("[PHONE]", text)
    text = HANDLE_PATTERN.sub("[HANDLE]", text)
    text = NAME_PATTERN.sub("[NAME]", text)
    return text


def scrub_dms(dms: Iterable[Dict[str, str]]) -> List[Dict[str, str]]:
    """Return new DMs list with PII scrubbed."""
    cleaned = []
    for dm in dms:
        msg = dm.get("message", "")
        cleaned.append({**dm, "message": scrub_text(msg)})
    return cleaned
