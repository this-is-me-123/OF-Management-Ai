# CRM & Subscriber Management

This module contains message templates and workflows for subscriber tiers.

## Structure
- `message_templates/` - Text or Markdown templates for subscriber outreach.
- `tier_definitions.yaml` - Tier names and criteria.

## Getting Started
1. Edit or add new templates in `message_templates/`.
2. Integrate these templates into your CRM automation scripts.
3. Configure the database:
   - By default `crm/db.py` uses an SQLite file `crm.db`.
   - Set the `DATABASE_URL` environment variable to connect to Postgres or
     specify `json` to use a simple JSON file store for quick testing.

## Example Workflow

Example workflows live under `crm/`:

- `onboarding.py` – sends the initial welcome and records the subscriber in the database.
- `retention.py` – emails a retention offer to inactive fans.
- `churn.py` – marks long inactive subscribers as churned and sends a final message.
- `process_events.py` – reads events from `data/sample_events.json` and triggers the appropriate workflow.

Each script logs messages to `crm_logs.txt` in this module's root. `process_events.py` also accepts a custom events file via `--file <path>`.

The `scheduler.py` module runs retention checks daily and churn checks weekly.

### Running Scripts

You can execute the workflows directly, for example:

```bash
python crm/onboarding.py --name Alice --id 1
python crm/process_events.py
```
