import json
import unittest
from pathlib import Path
import importlib.util
import tempfile

spec = importlib.util.spec_from_file_location(
    "fine_tune_persona",
    str(Path("02_ai_chat_persona/training_scripts/fine_tune_persona.py"))
)
fine_tune = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fine_tune)

class TestFineTunePersona(unittest.TestCase):
    def test_run_training(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            curves, samples = fine_tune.run_training(
                Path("02_ai_chat_persona/full_dm_archive_cleaned.json"),
                output_dir=tmpdir,
                epochs=2,
                seed_text="Hi",
            )
            self.assertTrue(curves.exists())
            self.assertTrue(samples.exists())
            with open(curves) as f:
                data = json.load(f)
            self.assertEqual(len(data["loss"]), 2)
            with open(samples) as f:
                lines = [line.strip() for line in f.readlines()]
            self.assertEqual(len(lines), 3)

if __name__ == "__main__":
    unittest.main()
