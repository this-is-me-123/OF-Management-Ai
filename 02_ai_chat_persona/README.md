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

## Curate & Anonymize Full Archive
Pull the remaining 1,500 DMs from your export, then run the anonymizer to remove names, handles and phone numbers. Spot-check samples to confirm no personal data remains.

## Define & Instrument Evaluation
Choose your success metrics (fluency, brand fit and engagement lift). Use the A/B harness to generate pairs and collect human ratings and click-through stats.

## Full Fine-Tuning Run
Training logs and sample outputs are written to the `training_logs/` directory.
Review `training_logs/training.log` to track the loss curve and open
`training_logs/sample_output.txt` for a quick sanity check of generated text.

## Closed-Beta Testing
Deploy the fine-tuned model to around **5%** of new inbound DMs. Monitor
engagement metrics (reply rate, click-throughs) and actively collect
qualitative feedback from testers.

## Iterate the Persona Prompt
Refine `persona_prompt.txt` using beta results. After each prompt change,
rerun the evaluation metrics to verify improvements.

## Evaluation Metrics
- **Fluency & Brand Fit:** 1–5 human ratings for each response pair.
- **Engagement Lift:** Delta in click-through or reply rates vs. the baseline.
