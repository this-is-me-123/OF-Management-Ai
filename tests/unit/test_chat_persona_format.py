# test_chat_persona_format.py

import unittest
import sys
from pathlib import Path

# Ensure repository root is on the path so aiClient can be imported when tests
# are run from subdirectories or CI environments.
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from aiClient import format_prompt

class TestChatPersonaFormat(unittest.TestCase):
    def test_format_prompt(self):
        prompt = format_prompt('Hello')
        self.assertTrue(prompt.startswith('User: Hello'))

if __name__ == '__main__':
    unittest.main()
