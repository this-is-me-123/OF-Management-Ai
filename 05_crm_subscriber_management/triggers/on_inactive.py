def on_inactive_subscriber(username, tier, days_inactive):
    print(f"Triggering retention message for {username}, inactive {days_inactive} days")
    # Logic to send retention message using /generate API
