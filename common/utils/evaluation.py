"""Evaluation harness for pairwise A/B tests.

Metrics:
- **Fluency & Brand-Fit**: human raters provide scores on a 1-5 scale.
- **Engagement Lift**: difference in click-throughs and reply counts vs. control.
"""

from typing import List, Dict


def _avg(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def evaluate_pairwise(control: List[Dict[str, float]], variant: List[Dict[str, float]]) -> Dict[str, float]:
    """Compute averages and engagement lift for two sets of DM responses."""
    metrics = {}

    metrics["fluency_control"] = _avg([r.get("fluency", 0) for r in control])
    metrics["fluency_variant"] = _avg([r.get("fluency", 0) for r in variant])

    metrics["brand_fit_control"] = _avg([r.get("brand_fit", 0) for r in control])
    metrics["brand_fit_variant"] = _avg([r.get("brand_fit", 0) for r in variant])

    metrics["clicks_control"] = _avg([r.get("clicks", 0) for r in control])
    metrics["clicks_variant"] = _avg([r.get("clicks", 0) for r in variant])

    metrics["replies_control"] = _avg([r.get("replies", 0) for r in control])
    metrics["replies_variant"] = _avg([r.get("replies", 0) for r in variant])

    metrics["engagement_lift_clicks"] = metrics["clicks_variant"] - metrics["clicks_control"]
    metrics["engagement_lift_replies"] = metrics["replies_variant"] - metrics["replies_control"]

    return metrics
