import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / '05_crm_subscriber_management'
if str(MODULE_PATH) not in sys.path:
    sys.path.insert(0, str(MODULE_PATH))

from crm import onboarding, retention, process_events, db, messaging
import subprocess
import tempfile
import json


class TestCRMWorkflows(unittest.TestCase):
    def test_onboard_and_retention(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            db.DB_FILE = Path(tmpdir) / 'db.json'
            messaging.LOG_FILE = Path(tmpdir) / 'log.txt'

            new_user = {'id': 3, 'name': 'Test', 'days_subscribed': 0, 'total_spend': 5}
            msg1 = onboarding.onboard_user(new_user)
            self.assertIn('Test', msg1)

            inactive = {'id': 4, 'name': 'Old', 'days_subscribed': 30, 'no_activity_days': 15, 'total_spend': 5}
            msg2 = retention.send_retention_offer(inactive)
            self.assertIn('Old', msg2)

    def test_cli_scripts(self):
        onboarding_path = MODULE_PATH / 'crm' / 'onboarding.py'
        result = subprocess.run(
            [sys.executable, str(onboarding_path), '--name', 'CLI', '--id', '5'],
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn('CLI', result.stdout)

    def test_process_events(self):
        events_file = MODULE_PATH / 'data' / 'sample_events.json'
        with tempfile.TemporaryDirectory() as tmpdir:
            db.DB_FILE = Path(tmpdir) / 'db.json'
            messaging.LOG_FILE = Path(tmpdir) / 'log.txt'
            process_events.process_events(events_file)

            data = json.load(open(db.DB_FILE))
            self.assertEqual(data['1']['tier'], 'Ultra')
            self.assertEqual(data['2']['segment'], 'At-Risk')

    def test_parse_condition_inclusive(self):
        self.assertTrue(onboarding.parse_condition('<=5', 5))
        self.assertTrue(onboarding.parse_condition('>=5', 5))
        with self.assertRaises(ValueError):
            onboarding.parse_condition('!=5', 4)


if __name__ == '__main__':
    unittest.main()
