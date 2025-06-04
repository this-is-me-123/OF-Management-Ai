# AI Chat Persona & Engagement

This module contains everything to train and test the GPT-based DM persona.

## Structure
- `training_scripts/` - Scripts for data prep, cleaning, and fine-tuning.
- `tests/` - Unit and integration tests for persona outputs.

## Getting Started
1. Run `node training_scripts/preprocess_dms.js` to clean raw DM logs.
2. Run `node training_scripts/fine_tune.js` to start fine-tuning.
3. Use `npm test` in this folder to verify tests in `tests/`.
