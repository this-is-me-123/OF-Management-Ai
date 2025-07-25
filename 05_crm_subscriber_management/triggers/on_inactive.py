from utils.content_generation import trigger_content_generation, get_latest_asset

def on_inactive_subscriber(username, tier, days_inactive):
    print(f"Triggering retention message for {username}, inactive {days_inactive} days")
    # 1. Trigger content generation
    gen_result = trigger_content_generation()
    asset = get_latest_asset()
    # 2. Compose retention message with generated asset
    message = f"Hey {username}, we've missed you! Check out this new content."
    asset_path = asset['image_path'] if asset and 'image_path' in asset else None
    # Real delivery: POST to /send endpoint
    import requests
    payload = {
        "username": username,
        "tier": tier,
        "message_type": "Retention",
        "message": message,
        "asset_path": asset_path
    }
    try:
        resp = requests.post("http://127.0.0.1:5001/send", json=payload)
        print(f"[DELIVERY] Sent retention message: {resp.json()}")
    except Exception as e:
        print(f"[ERROR] Failed to send retention message: {e}")
