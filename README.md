# OF Management AI Project

This repository contains several modules to automate content creation, engagement, and analytics for OnlyFans creators. Each module lives in its own directory numbered `01`–`07`.

## Modules Overview

| Folder | Description |
| ------ | ----------- |
| **01_content_strategy** | Editorial calendars, persona definitions, and promotion plans. |
| **02_ai_chat_persona** | Training data and scripts for the GPT-based DM persona. |
| **03_scheduling_automation** | Scripts and services for scheduling and posting content. |
| **04_content_generation** | Prompt templates and prototype pipeline for AI-generated media. |
| **05_crm_subscriber_management** | Templates and docs for managing subscribers and retention. |
| **06_revenue_optimization** | Pricing models, upsell scripts, and A/B test data. |
| **07_analytics_reporting** | ETL code and dashboards for metrics and insights. |

Additional directories:

- **common/** – Shared utilities, environment examples, and Python requirements.
- **docs/** – Architecture notes, integration guides, and project timeline.
- **tests/** – Unit and e2e tests spanning multiple modules.

## Basic Setup

1. **Clone the repo** and install Python dependencies:
   ```bash
   pip install -r common/requirements.txt
   ```
2. **Install Node dependencies** for modules that contain a `package.json` (e.g. the scheduler frontend):
   ```bash
   cd path/to/module && npm install
   ```
3. **Create your `.env` file** based on `common/env.example` and fill in the required keys.
4. **Run tests** from the repository root:
   ```bash
   # Python tests
   pytest

   # JavaScript tests
   npm test
   ```

See the individual module READMEs and `docs/` for more details on configuration and usage.


