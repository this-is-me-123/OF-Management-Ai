# Evaluation Harness

This document describes the metrics and tooling used to assess DM persona quality.

## Metrics
- **Fluency & Brand-Fit** – Human raters score each response on a 1–5 scale.
- **Engagement Lift** – Click-through and reply count deltas versus the control group.

## A/B Test Harness
The Python module `common/utils/evaluation.py` computes averages for each metric
and returns the engagement lift between two sets of messages.

Use `evaluate_pairwise(control, variant)` to compare results collected from an
experiment:
```python
from common.utils.evaluation import evaluate_pairwise
metrics = evaluate_pairwise(control_data, variant_data)
```
