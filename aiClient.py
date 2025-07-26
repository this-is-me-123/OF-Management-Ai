"""Simple AI client stub for tests."""

def format_prompt(message: str) -> str:
    """Return a formatted prompt string."""
    return f"User: {message}\nAssistant:"


def generate_response(message: str) -> str:
    """Return a canned polite response."""
    return "Sure, I'd be happy to help with that!"
