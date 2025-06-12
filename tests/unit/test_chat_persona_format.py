# test_chat_persona_format.py

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from aiClient import format_prompt

class TestChatPersonaFormat(unittest.TestCase):
    def test_format_prompt(self):
        prompt = format_prompt('Hello')
        self.assertTrue(prompt.startswith('User: Hello'))

if __name__ == '__main__':
    unittest.main()
