
# OF Management AI Project

## Overview

Modular system for OnlyFans management, content, AI persona engagement, CRM, revenue optimization, and analytics.

---

## 📁 Modules

| Folder                       | Description                                                  |
|------------------------------|--------------------------------------------------------------|
| 01_content_strategy          | Editorial calendars, persona definitions, promotion plans     |
| 02_ai_chat_persona           | GPT-based persona data, fine-tuning scripts, DM dataset      |
| 03_scheduling_automation     | Content scheduling, posting UI/backend, API automation       |
| 04_content_generation        | Prompt templates, AI image/video pipeline, hero asset POC    |
| 05_crm_subscriber_management | Tiers, segmentation, onboarding/retention, CRM workflows     |
| 06_revenue_optimization      | Pricing models, upsell scripts, A/B testing                  |
| 07_analytics_reporting       | ETL code, dashboards, KPIs, reporting                        |
| 08_onlyfans_model            | (If present) Model onboarding, admin                         |
| common/                      | Shared utils (PII scrub, requirements, etc.)                 |
| tests/                       | Unified Python and JS test files                             |

---

## 🧪 Test Coverage

| Module               | Test File(s)                        | Description                                  |
|----------------------|-------------------------------------|----------------------------------------------|
| CRM                  | crm_integration.test.py             | Retention offer API integration test         |
| Persona              | test_fine_tune_persona.py           | Persona prompt existence                     |
| Persona/Training     | test_bigram_fine_tune.py            | Full training and output validation          |
| Persona/Format       | test_chat_persona_format.py          | Prompt format checks                         |
| Utility              | test_pii_scrub.py                   | PII removal from text/DMs                    |
| Scheduler            | test_scheduler_ui.py                | Scheduler UI mockup check                    |
| Revenue Optimization | test_upsell_script_performance.py   | Upsell script validation                     |
| Revenue Optimization | test_price_calculation.js           | Price logic testing (JS)                     |
| Subscriber           | subscriber_flow.test.js             | Subscriber flow/Journey (JS)                 |

---

## 🚀 One-Click Test Automation

**Run all Python and Node/JS tests:**

- **Bash (Linux/Mac/Git Bash/WSL):**
    ```bash
    ./run_all_tests.sh
    ```
- **Windows CMD:**
    ```bat
    run_all_tests.bat
    ```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in required tokens like
`OPENAI_API_KEY` and `OF_API_KEY`.

---

## ⚡️ Automation Overview

- **All major workflows are scriptable for cron/CI.**
- **Recommended:**  
  - Set up GitHub Actions or your CI system to call `run_all_tests.sh` or `.bat` on every PR/push.
  - Use the provided scripts for nightly regression runs, pre-deploy checks, and health monitoring.

---

## ✅ Next Steps

- Finish module integrations, especially CRM, scheduler, and analytics automation.
- Ensure all referenced test/data files are in place for end-to-end runs.
- Add/expand module-level READMEs for onboarding contributors.
- Use the automation scripts for continuous validation as you build!

---

## 🙋‍♂️ Support

Questions or need help?  
Open an issue, or contact the maintainers via GitHub!
