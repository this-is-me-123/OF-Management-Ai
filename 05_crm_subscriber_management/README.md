# CRM & Subscriber Management

This module contains message templates and workflows for subscriber tiers.

## Structure
- `message_templates/` - Text or Markdown templates for subscriber outreach.
- `tier_definitions.yaml` - Tier names and criteria.

## Getting Started
1. Edit or add new templates in `message_templates/`.
2. Integrate these templates into your CRM automation scripts.

## Example Workflow

Example workflows live under `crm/`:

- `onboarding.py` – welcomes new subscribers using tier definitions.
- `retention.py` – sends a retention offer to inactive fans.
- `process_events.py` – reads events from `data/sample_events.json` and
  triggers the appropriate workflow.

Each script logs messages to `crm_logs.txt` in this module's root.
`process_events.py` also accepts a custom events file via `--file <path>`.

### Running Scripts

You can execute the workflows directly, for example:

```bash
python crm/onboarding.py --name Alice --id 1
python crm/process_events.py
```
