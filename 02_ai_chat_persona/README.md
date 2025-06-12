# AI Chat Persona & Engagement

This module contains everything to train and test the GPT-based DM persona.

## Structure
- `training_scripts/` - Scripts for data prep, cleaning, and fine-tuning.
- `evaluation/` - Tools for pairwise A/B tests and metric tracking.
- `tests/` - Unit and integration tests for persona outputs.

## Getting Started
1. Run `python training_scripts/anonymize_archive.py full_dm_archive_raw.csv full_dm_archive_cleaned.json --names_file names.txt` to scrub personal data (the `--names_file` argument is optional but lets you provide a custom list of names to remove).
2. Run `node training_scripts/preprocess_dms.js` to create a JSONL dataset.
3. Run `python training_scripts/fine_tune_persona.py --data full_dm_archive_cleaned.json --out_dir training_logs` to kick off a fine-tuning job.
4. Optionally run `python evaluation/ab_test.py --baseline baseline.jsonl --candidate candidate.jsonl --out_pairs eval_pairs.json` to generate pairs for rating.
5. After you gather ratings and engagement stats, run `python evaluation/ab_test.py --ratings ratings.json --engagement engagement.json` to compute metrics.
6. Use `npm test` in this folder to verify tests in `tests/`.
