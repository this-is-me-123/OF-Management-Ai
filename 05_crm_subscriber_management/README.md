# CRM & Subscriber Management

This module contains message templates and workflows for subscriber tiers.

## Structure
- `message_templates/` - Text or Markdown templates for subscriber outreach.
- `tier_definitions.yaml` - Tier names and criteria.

## Getting Started
1. Edit or add new templates in `message_templates/`.
2. Integrate these templates into your CRM automation scripts.

## Example Workflow

`crm/onboarding.py` is a simple Python script that loads the segmentation rules
and tier definitions to send a tier-specific welcome message for new
subscribers. Run it from this folder to see console output.
