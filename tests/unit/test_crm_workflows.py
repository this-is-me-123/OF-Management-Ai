import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / '05_crm_subscriber_management'
if str(MODULE_PATH) not in sys.path:
    sys.path.insert(0, str(MODULE_PATH))

from crm import onboarding, retention
import subprocess


class TestCRMWorkflows(unittest.TestCase):
    def test_onboard_and_retention(self):
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


if __name__ == '__main__':
    unittest.main()
