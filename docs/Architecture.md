# OnlyFans Management AI System Architecture

![Architecture Diagram](architecture_diagram.png)

## Overview
- **Frontend:** React/Vue app for subscriber interaction.
- **Backend:** Node.js API that handles auth, scheduling, payments, CRM triggers.
- **AI Backend:** Services for chat persona, analytics, CRM message generation.
- **Database:** PostgreSQL for user, session, job data.
- **Cache/Queue:** Redis for job queuing (scheduler, worker).
- **ETL & Reporting:** Python scripts + data warehouse for analytics.

## Data Flow
1. Subscriber signs up → stored in `users` table.
2. Payment processed → triggers CRM retention check.
3. Scheduler polls for due posts → publishes via Puppeteer or API.
4. AI insights module analyzes payment and engagement data → feeds back recommendations.

## Technologies
- Node.js, Express, Puppeteer, Supabase, OpenAI, Python (pandas, scikit-learn), PostgreSQL, Redis.
