# Scheduling & Posting Automation

This module handles scheduling posts to OnlyFans (and optionally Hootsuite).

## Structure
- `scheduler.js` - Core scheduler logic.
- `config/` - Configuration files (times, retries, API keys).
- `docs/` - API specs and architecture diagrams.
- `publishService.js` - Helper that publishes posts to OnlyFans or Hootsuite.
- `browser_automation_service/frontend/src/components/` - React components for the scheduler UI.

## Getting Started
1. Fill in `config/hootsuite_credentials.json` with your Hootsuite API keys.
2. Edit `config/scheduler.config.js` to set default posting windows.
3. Run `node scheduler.js` to launch the scheduler.
4. `publishService.js` is used internally by the scheduler to post content; edit
   it if you need to integrate with additional platforms.
