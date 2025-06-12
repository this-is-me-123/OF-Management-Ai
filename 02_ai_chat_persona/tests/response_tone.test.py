# response_tone.test.py

import unittest
import sys
from pathlib import Path

# Add repo root to path so the aiClient module is discoverable when tests are
# executed from this nested directory.
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from aiClient import generate_response

class TestResponseTone(unittest.TestCase):
    def test_politeness(self):
        resp = generate_response('Can you help me?')
        self.assertTrue('Sure, I\'d be happy to help' in resp)

if __name__ == '__main__':
    unittest.main()
