# AI Chat Persona & Engagement

This module contains everything to train and test the GPT-based DM persona.

## Structure
- `training_scripts/` - Scripts for data prep, cleaning, and fine-tuning.
- `evaluation/` - Lightweight harness for comparing model variants.
- `tests/` - Unit and integration tests for persona outputs.

## Getting Started
1. Run `python training_scripts/anonymize_archive.py` to scrub personal data.
2. Run `node training_scripts/preprocess_dms.js` to create a JSONL dataset.
3. Run `node training_scripts/fine_tune.js` to start fine-tuning.
4. Optionally run `python evaluation/ab_test.py baseline.jsonl candidate.jsonl` to score a new model.
5. Use `npm test` in this folder to verify tests in `tests/`.
