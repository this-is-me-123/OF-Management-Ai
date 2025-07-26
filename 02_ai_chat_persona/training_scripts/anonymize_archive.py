"""Anonymize raw DM archive by scrubbing simple PII patterns."""
import csv
import json
import re

PII_PATTERNS = [
    r"@\w+",                       # handles
    r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b"  # phone numbers
]

def scrub(text: str) -> str:
    for pat in PII_PATTERNS:
        text = re.sub(pat, "[REDACTED]", text)
    return text


def main():
    messages = []
    with open("full_dm_archive_raw.csv", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inbound = scrub(row.get("inbound", ""))
            response = scrub(row.get("response", ""))
            messages.append({"inbound": inbound, "response": response})

    out_path = "full_dm_archive_cleaned.json"
    with open(out_path, "w") as f:
        json.dump({"messages": messages}, f, indent=2)
    print(f"Wrote {len(messages)} messages to {out_path}")


if __name__ == "__main__":
    main()
