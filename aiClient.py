"""Minimal AI client used for unit tests."""

def format_prompt(text: str) -> str:
    """Return a formatted prompt string."""
    return f"User: {text}\nAI:"

def generate_response(text: str) -> str:
    """Return a canned response for demonstration."""
    return "Sure, I'd be happy to help with that."
