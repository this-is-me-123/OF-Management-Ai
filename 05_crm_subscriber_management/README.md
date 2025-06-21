# CRM & Subscriber Management (Finalized ✅)

## Features
- Tiered welcome and retention messages
- Message template generator API (`/generate`)
- Message sender API with logging (`/send`)
- Redis-powered async message queue
- Message log saved to `logs/message_log.jsonl`

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
## To Run
>>>>>>> Stashed changes
=======
## To Run
>>>>>>> Stashed changes

1. **Start Flask API**
```bash
cd api
python generate_message.py
```

2. **Dispatch a test job**
```bash
python queue/dispatch_job.py
```

3. **Run the queue worker**
```bash
python queue/worker.py
```

Make sure Redis is running locally on port 6379.
