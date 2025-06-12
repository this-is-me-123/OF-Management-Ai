from pathlib import Path

# Default persona prompt file relative to repo root
PERSONA_PROMPT_PATH = Path(__file__).resolve().parents[1] / '02_ai_chat_persona' / 'persona_prompt.txt'


def format_prompt(user_text: str) -> str:
    """Format a user message for the chat persona."""
    return f"User: {user_text}"


def _load_persona_prompt(path: Path = PERSONA_PROMPT_PATH) -> str:
    """Return persona prompt text if available."""
    try:
        return path.read_text().strip()
    except FileNotFoundError:
        return 'You are an OnlyFans engagement assistant.'


def generate_response(user_text: str, prompt_path: Path = PERSONA_PROMPT_PATH) -> str:
    """Generate a simple canned response for testing purposes."""
    _ = _load_persona_prompt(prompt_path)
    if user_text.lower().startswith('can you help'):
        return "Sure, I'd be happy to help with that!"
    formatted = format_prompt(user_text)
    return f"Echo: {formatted}"
