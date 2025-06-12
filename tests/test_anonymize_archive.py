import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '02_ai_chat_persona' / 'training_scripts'))

from anonymize_archive import scrub, main

def test_scrub_replaces_handle_and_phone():
    text = "Hey @john call me at 555-123-4567"
    result = scrub(text)
    assert "@" not in result
    assert "555" not in result


def test_main_writes_file(tmp_path):
    csv_path = tmp_path / "in.csv"
    with open(csv_path, "w") as f:
        f.write("inbound,response\nHi John,hello\n")
    out_json = tmp_path / "out.json"
    main(str(csv_path), str(out_json))
    assert out_json.exists()


def test_names_file(tmp_path):
    csv_path = tmp_path / "in.csv"
    with open(csv_path, "w") as f:
        f.write("inbound,response\nHi Alice,hello\n")
    names = tmp_path / "names.txt"
    names.write_text("Alice\n")
    out_json = tmp_path / "out.json"
    main(str(csv_path), str(out_json), str(names))
    data = json.load(open(out_json))
    assert "Alice" not in data["messages"][0]["inbound"]
