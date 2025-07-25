import requests

def test_onboarding():
    resp = requests.post("http://127.0.0.1:5001/send", json={
        "username": "testuser1",
        "tier": "VIP",
        "message_type": "Welcome",
        "message": "Welcome, testuser1! Enjoy your exclusive content.",
        "asset_path": "assets/test_asset1.png"
    })
    print("Onboarding response:", resp.json())

def test_retention():
    resp = requests.post("http://127.0.0.1:5001/send", json={
        "username": "testuser2",
        "tier": "Standard",
        "message_type": "Retention",
        "message": "Hey testuser2, we've missed you! Check out this new content.",
        "asset_path": "assets/test_asset2.png"
    })
    print("Retention response:", resp.json())

def test_campaign():
    resp = requests.post("http://127.0.0.1:5001/campaign", json={
        "username": "testuser3",
        "tier": "VIP",
        "message_type": "Campaign"
    })
    print("Campaign response:", resp.json())

if __name__ == "__main__":
    test_onboarding()
    test_retention()
    test_campaign()
