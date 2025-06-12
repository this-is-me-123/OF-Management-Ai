from pathlib import Path
import sys
import json

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '02_ai_chat_persona' / 'evaluation'))

from ab_test import evaluate_ratings, evaluate_engagement


def test_evaluate_ratings():
    data = [
        {"baseline_rating": 3, "candidate_rating": 4},
        {"baseline_rating": 2, "candidate_rating": 5},
    ]
    path = ROOT / 'tmp_ratings.json'
    with open(path, 'w') as f:
        json.dump(data, f)
    cand, base = evaluate_ratings(str(path))
    assert cand == 4.5
    assert base == 2.5
    path.unlink()


def test_evaluate_engagement():
    metrics = {
        "baseline": {"impressions": 100, "clicks": 10, "replies": 5},
        "candidate": {"impressions": 100, "clicks": 15, "replies": 8},
    }
    path = ROOT / 'tmp_engagement.json'
    with open(path, 'w') as f:
        json.dump(metrics, f)
    click_lift, reply_lift = evaluate_engagement(str(path))
    assert abs(click_lift - 0.05) < 1e-6
    assert abs(reply_lift - 0.03) < 1e-6
    path.unlink()
