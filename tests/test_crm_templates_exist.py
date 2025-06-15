import os

def test_crm_templates_exist():
    templates = [
        'new_subscriber_welcome.txt',
        'inactivity_7day_drip.txt',
        'vip_upsell_offer.txt',
        'milestone_celebration.txt',
        'renewal_reminder.txt',
        'churn_warning_followup.txt'
    ]
    base = '05_crm_subscriber_management/message_templates'
    for t in templates:
        assert os.path.exists(os.path.join(base, t))
