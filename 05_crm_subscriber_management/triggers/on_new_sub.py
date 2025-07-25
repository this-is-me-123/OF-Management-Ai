from utils.content_generation import trigger_content_generation, get_latest_asset

def on_new_subscriber(username, tier):
    print(f"Triggered welcome message for {username} ({tier})")
    # 1. Trigger content generation
    gen_result = trigger_content_generation()
    asset = get_latest_asset()
    # 2. Compose welcome message with generated asset
    message = f"Welcome, {username}! Enjoy your exclusive content."
    asset_path = asset['image_path'] if asset and 'image_path' in asset else None
    # Real delivery: POST to /send endpoint
    import requests
    payload = {
        "username": username,
        "tier": tier,
        "message_type": "Welcome",
        "message": message,
        "asset_path": asset_path
    }
    try:
        resp = requests.post("http://127.0.0.1:5001/send", json=payload)
        print(f"[DELIVERY] Sent onboarding message: {resp.json()}")
    except Exception as e:
        print(f"[ERROR] Failed to send onboarding message: {e}")
