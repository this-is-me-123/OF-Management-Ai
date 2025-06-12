"""Simple A/B evaluation harness for DM responses."""
import argparse
import json


def load_jsonl(path):
    with open(path) as f:
        return [json.loads(line) for line in f if line.strip()]


def evaluate(baseline_path, candidate_path):
    baseline = load_jsonl(baseline_path)
    candidate = load_jsonl(candidate_path)
    pairs = zip(baseline, candidate)
    wins = 0
    total = 0
    for b, c in pairs:
        if len(c.get("completion", "")) < len(b.get("completion", "")):
            wins += 1
        total += 1
    return wins / total if total else 0.0


def main():
    parser = argparse.ArgumentParser(description="Run simple pairwise evaluation")
    parser.add_argument("baseline", help="Baseline JSONL file")
    parser.add_argument("candidate", help="Candidate JSONL file")
    args = parser.parse_args()
    win_rate = evaluate(args.baseline, args.candidate)
    print(f"Candidate win rate: {win_rate:.2%}")


if __name__ == "__main__":
    main()
