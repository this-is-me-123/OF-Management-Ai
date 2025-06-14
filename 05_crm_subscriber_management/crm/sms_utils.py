import os
from vonage import Client, Sms

VONAGE_API_KEY = os.environ.get("VONAGE_API_KEY")
VONAGE_API_SECRET = os.environ.get("VONAGE_API_SECRET")
VONAGE_FROM = os.environ.get("VONAGE_FROM", "VonageSMS")

client = Client(key=VONAGE_API_KEY, secret=VONAGE_API_SECRET)
sms = Sms(client)

def send_sms(to_number, content):
    response = sms.send_message({
        "from": VONAGE_FROM,
        "to": to_number,
        "text": content,
    })
    return response
