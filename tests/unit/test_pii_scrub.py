import unittest
from common.utils.pii_scrub import scrub_text, scrub_dms

class TestPiiScrub(unittest.TestCase):
    def test_scrub_text(self):
        sample = "Call me at 555-123-4567 or DM @alice. Regards, Bob Smith"
        cleaned = scrub_text(sample)
        self.assertNotIn("555-123-4567", cleaned)
        self.assertNotIn("@alice", cleaned)
        self.assertNotIn("Bob Smith", cleaned)

    def test_scrub_dms(self):
        dms = [{"sender": "Alice", "message": "Hey @bob call 123-456-7890"}]
        result = scrub_dms(dms)
        msg = result[0]["message"]
        self.assertNotIn("123-456-7890", msg)
        self.assertNotIn("@bob", msg)
        self.assertIn("[PHONE]", msg)
        self.assertIn("[HANDLE]", msg)

if __name__ == '__main__':
    unittest.main()
