import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '02_ai_chat_persona' / 'training_scripts'))

from anonymize_archive import scrub

def test_scrub_replaces_handle_and_phone():
    text = "Hey @john call me at 555-123-4567"
    result = scrub(text)
    assert "@" not in result
    assert "555" not in result
