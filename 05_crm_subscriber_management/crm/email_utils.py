import os
import requests

MAILGUN_DOMAIN = os.environ.get("MAILGUN_DOMAIN")
MAILGUN_API_KEY = os.environ.get("MAILGUN_API_KEY")
MAILGUN_FROM = os.environ.get("MAILGUN_FROM", "noreply@example.com")

def send_email(to_email, subject, content):
    return requests.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from": MAILGUN_FROM,
            "to": [to_email],
            "subject": subject,
            "text": content,
        },
    )
