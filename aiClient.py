"""Minimal AI client used for unit tests."""

def format_prompt(text: str) -> str:
    """Return the user text formatted for the model."""
    return f"User: {text}"


def generate_response(prompt: str) -> str:
    """Return a canned polite response used in tests."""
    return "Sure, I'd be happy to help!"
