import requests

def test_vip_welcome():
    r = requests.get("http://localhost:5001/generate?tier=VIP&message_type=Welcome")
    assert r.status_code == 200
    assert "VIP access" in r.json().get("message", "")
