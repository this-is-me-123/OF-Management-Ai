# crm_integration.test.py

import unittest
import requests

class TestCRMIntegration(unittest.TestCase):
    def test_retention_offer_sent(self):
        resp = requests.get('http://localhost:3000/api/crm/pending_offers')
        data = resp.json()
        self.assertTrue(len(data) > 0)

if __name__ == '__main__':
    unittest.main()
