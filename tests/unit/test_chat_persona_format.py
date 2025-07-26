# test_chat_persona_format.py

import unittest
from aiClient import format_prompt

class TestChatPersonaFormat(unittest.TestCase):
    def test_format_prompt(self):
        prompt = format_prompt('Hello')
        self.assertTrue(prompt.startswith('User: Hello'))

if __name__ == '__main__':
    unittest.main()
