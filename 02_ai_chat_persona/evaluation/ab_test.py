"""Evaluation harness for pairwise A/B tests."""
import argparse
import json
from typing import List, Dict, Tuple


def load_jsonl(path: str) -> List[Dict]:
    """Load a JSONL file into a list of dictionaries."""
    with open(path) as f:
        return [json.loads(line) for line in f if line.strip()]


def generate_pairs(baseline_path: str, candidate_path: str, out_path: str) -> None:
    """Create a JSON file with paired baseline and candidate completions."""
    baseline = load_jsonl(baseline_path)
    candidate = load_jsonl(candidate_path)

    if len(baseline) != len(candidate):
        raise ValueError("Baseline and candidate sets must have equal length")

    pairs = []
    for b, c in zip(baseline, candidate):
        pairs.append({
            "prompt": b.get("prompt"),
            "baseline": b.get("completion"),
            "candidate": c.get("completion"),
        })
    with open(out_path, "w") as f:
        json.dump(pairs, f, indent=2)


def average(values: List[float]) -> float:
    """Return the arithmetic mean of a list of numbers."""
    return sum(values) / len(values) if values else 0.0


def evaluate_ratings(ratings_path: str) -> Tuple[float, float]:
    """Return average candidate and baseline scores from a ratings JSON."""
    with open(ratings_path) as f:
        rows = json.load(f)
    base_scores = [r["baseline_rating"] for r in rows]
    cand_scores = [r["candidate_rating"] for r in rows]
    return average(cand_scores), average(base_scores)


def _rate(part: int, total: int) -> float:
    """Safe division returning zero when total is zero."""
    return part / total if total else 0.0


def evaluate_engagement(metrics_path: str) -> Tuple[float, float]:
    """Compute engagement deltas from a metrics JSON file."""
    with open(metrics_path) as f:
        data = json.load(f)
    base = data["baseline"]
    cand = data["candidate"]
    base_ctr = _rate(base["clicks"], base["impressions"])
    cand_ctr = _rate(cand["clicks"], cand["impressions"])
    base_reply = _rate(base["replies"], base["impressions"])
    cand_reply = _rate(cand["replies"], cand["impressions"])
    return cand_ctr - base_ctr, cand_reply - base_reply


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute A/B evaluation metrics")
    parser.add_argument("--baseline", help="Baseline JSONL responses")
    parser.add_argument("--candidate", help="Candidate JSONL responses")
    parser.add_argument("--out_pairs", help="Path to write paired prompts")
    parser.add_argument("--ratings", help="JSON file with human ratings")
    parser.add_argument("--engagement", help="JSON file with engagement metrics")
    args = parser.parse_args()

    if args.out_pairs and args.baseline and args.candidate:
        generate_pairs(args.baseline, args.candidate, args.out_pairs)
        print(f"Wrote evaluation pairs to {args.out_pairs}")

    if args.ratings:
        cand_avg, base_avg = evaluate_ratings(args.ratings)
        print(f"Average candidate rating: {cand_avg:.2f}")
        print(f"Average baseline rating: {base_avg:.2f}")

    if args.engagement:
        click_lift, reply_lift = evaluate_engagement(args.engagement)
        print(f"Click-through lift: {click_lift:.2%}")
        print(f"Reply-rate lift: {reply_lift:.2%}")


if __name__ == "__main__":
    main()
