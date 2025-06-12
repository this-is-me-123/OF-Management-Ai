"""Anonymize raw DM archive by scrubbing simple PII patterns."""
import csv
import json
import re

PII_PATTERNS = [
    r"@\w+",                       # handles
    r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",  # phone numbers
    r"\b[A-Z][a-z]+\b",              # simple capitalized names
]

def scrub(text: str) -> str:
    for pat in PII_PATTERNS:
        text = re.sub(pat, "[REDACTED]", text)
    return text


def main(in_path: str, out_path: str) -> None:
    messages = []
    with open(in_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inbound = scrub(row.get("inbound", ""))
            response = scrub(row.get("response", ""))
            messages.append({"inbound": inbound, "response": response})

    with open(out_path, "w") as f:
        json.dump({"messages": messages}, f, indent=2)
    print(f"Wrote {len(messages)} messages to {out_path}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Anonymize a DM CSV archive")
    parser.add_argument("in_csv", help="Raw CSV file")
    parser.add_argument("out_json", help="Path to write cleaned JSON")
    args = parser.parse_args()

    main(args.in_csv, args.out_json)
