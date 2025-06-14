"""Simple messaging utilities used during onboarding."""


def send_message(recipient: str, content: str):
    """Send a message to a subscriber.

    For now this just prints to stdout but can be replaced with
    email or SMS integrations.
    """
    print(content)
    return content
