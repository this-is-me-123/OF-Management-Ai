# response_tone.test.py

import unittest
from aiClient import generate_response

class TestResponseTone(unittest.TestCase):
    def test_politeness(self):
        resp = generate_response('Can you help me?')
        self.assertTrue('Sure, I\'d be happy to help' in resp)

if __name__ == '__main__':
    unittest.main()
