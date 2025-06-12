import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "02_ai_chat_persona" / "training_scripts" / "fine_tune_persona.py"


def test_fine_tune_outputs(tmp_path):
    data = {"messages": [{"inbound": "hi", "response": "hello"}]}
    data_path = tmp_path / "data.json"
    with open(data_path, "w") as f:
        json.dump(data, f)

    out_dir = tmp_path / "logs"
    subprocess.check_call([sys.executable, str(SCRIPT), "--data", str(data_path), "--out_dir", str(out_dir)])

    assert (out_dir / "training.log").exists()
    assert (out_dir / "sample_output.txt").exists()
