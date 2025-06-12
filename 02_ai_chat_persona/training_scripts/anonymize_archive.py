"""Anonymize raw DM archive by scrubbing simple PII patterns."""
import csv
import json
import re

PII_PATTERNS = [
    r"@\w+",                       # handles
    r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",  # phone numbers
]

def load_names(path: str | None) -> list[str]:
    """Return a list of names from a file if provided."""
    if not path:
        return []
    with open(path) as f:
        return [line.strip() for line in f if line.strip()]

def build_name_pattern(names: list[str]) -> str:
    """Return a regex that matches any of the given names."""
    if not names:
        # Fallback pattern for simple capitalized words
        return r"\b[A-Z][a-z]+\b"
    escaped = [re.escape(n) for n in names]
    return r"\b(?:" + "|".join(escaped) + r")\b"

def scrub(text: str, patterns: list[str] | None = None) -> str:
    """Replace any PII patterns in the given text."""
    if patterns is None:
        patterns = PII_PATTERNS + [build_name_pattern([])]
    for pat in patterns:
        text = re.sub(pat, "[REDACTED]", text)
    return text


def main(in_path: str, out_path: str, names_file: str | None = None) -> None:
    """Anonymize a CSV archive and write cleaned JSON."""
    patterns = PII_PATTERNS + [build_name_pattern(load_names(names_file))]

    messages = []
    with open(in_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inbound = scrub(row.get("inbound", ""), patterns)
            response = scrub(row.get("response", ""), patterns)
            messages.append({"inbound": inbound, "response": response})

    with open(out_path, "w") as f:
        json.dump({"messages": messages}, f, indent=2)
    print(f"Wrote {len(messages)} messages to {out_path}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Anonymize a DM CSV archive")
    parser.add_argument("in_csv", help="Raw CSV file")
    parser.add_argument("out_json", help="Path to write cleaned JSON")
    parser.add_argument(
        "--names_file",
        help="Optional text file with one name per line to scrub",
        default=None,
    )
    args = parser.parse_args()

    main(args.in_csv, args.out_json, args.names_file)
