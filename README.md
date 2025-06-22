# OF Management AI

This repository organizes automation scripts and planning resources for managing an OnlyFans business. Detailed architecture notes and guides live in the [docs/](docs/) folder.

## Modules

- **01_content_strategy** – planning artifacts and calendars for content strategy.
- **02_ai_chat_persona** – training data and tests for the GPT-based DM persona.
- **03_scheduling_automation** – scheduler and browser automation for posting content.
- **04_content_generation** – AI-driven tools for images, video, and captions.
  See `04_content_generation/pipeline_spec.md` for the end-to-end generation workflow and environment variables.
- **05_crm_subscriber_management** – templates and workflows for subscriber outreach.
- **06_revenue_optimization** – pricing strategies, upsell scripts, and A/B test results.
- **07_analytics_reporting** – ETL pipelines, analytics modules, and sample data snapshots.

## Setup

1. Copy any `*.env.example` file to `.env` and update values.
2. Create a Python virtual environment and install dependencies:
   ```bash
   ./setup_venv.sh
   ```
3. Install Node dependencies in modules that contain a `package.json`, for example:
   ```bash
   cd 03_scheduling_automation/browser_automation_service
   npm install
   ```
4. Run tests from the repository root:
   ```bash
   ./run_all_tests.sh
   ```

