# AI Chat Persona & Engagement

This module contains everything to train and test the GPT-based DM persona.

## Structure
- `training_scripts/` - Scripts for data prep, cleaning, and fine-tuning.
- `evaluation/` - Tools for pairwise A/B tests and metric tracking.
- `tests/` - Unit and integration tests for persona outputs.

## Getting Started
1. Run `python training_scripts/anonymize_archive.py` to scrub personal data.
2. Run `node training_scripts/preprocess_dms.js` to create a JSONL dataset.
3. Run `node training_scripts/fine_tune.js` to start fine-tuning.
4. Optionally run `python evaluation/ab_test.py --baseline baseline.jsonl --candidate candidate.jsonl --out_pairs eval_pairs.json` to generate pairs for rating.
5. After you gather ratings and engagement stats, run `python evaluation/ab_test.py --ratings ratings.json --engagement engagement.json` to compute metrics.
6. Use `npm test` in this folder to verify tests in `tests/`.

## Evaluation Metrics
- **Fluency & Brand Fit:** 1–5 human ratings for each response pair.
- **Engagement Lift:** Delta in click-through or reply rates vs. the baseline.
