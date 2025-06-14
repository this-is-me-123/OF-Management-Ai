# scheduler.py

from apscheduler.schedulers.blocking import BlockingScheduler
from retention import run_retention

def main():
    scheduler = BlockingScheduler(timezone="UTC")
    # Schedule run_retention to run once daily at midnight UTC
    scheduler.add_job(
        run_retention,
        trigger="cron",
        hour=0,
        minute=0,
        id="daily_retention"
    )
    print("Starting retention scheduler (daily at 00:00 UTC)...")
    scheduler.start()

if __name__ == "__main__":
    main()
