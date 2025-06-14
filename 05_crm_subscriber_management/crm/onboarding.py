import json
from pathlib import Path
import yaml
import argparse

from . import db, messaging


BASE_DIR = Path(__file__).resolve().parents[1]
RULES_FILE = BASE_DIR / "segmentation_rules.json"
TIERS_FILE = BASE_DIR / "tier_definitions.yaml"
TEMPLATES_DIR = BASE_DIR / "message_templates"


def load_rules():
    with open(RULES_FILE, 'r') as f:
        data = json.load(f)
    return data.get('rules', [])


def load_tiers():
    with open(TIERS_FILE, 'r') as f:
        data = yaml.safe_load(f)
    return data.get('tiers', [])


def parse_condition(value_str, actual):
    """Evaluate a simple condition like '<7' or '>100'."""
    if value_str.startswith('<'):
        return actual < float(value_str[1:])
    if value_str.startswith('>'):
        return actual > float(value_str[1:])
    return str(actual) == str(value_str)


def assign_segment(user, rules):
    for rule in rules:
        segment = rule.get('segment')
        conditions = {k: v for k, v in rule.items() if k != 'segment'}
        matched = True
        for field, cond in conditions.items():
            actual = user.get(field)
            if actual is None or not parse_condition(cond, actual):
                matched = False
                break
        if matched:
            return segment
    return 'Unsegmented'


def assign_tier(user, tiers):
    spend = user.get('total_spend', 0)
    # Simple heuristic using spend; names come from config
    tier_order = [t['name'] for t in tiers]
    if spend > 100 and 'Ultra' in tier_order:
        return 'Ultra'
    if spend > 50 and 'VIP' in tier_order:
        return 'VIP'
    return tier_order[0] if tier_order else 'Basic'


def load_template(tier):
    mapping = {
        'Basic': 'welcome_new_sub.txt',
        'VIP': 'tier1_welcome.md',
        'Ultra': 'tier1_welcome.md'
    }
    filename = mapping.get(tier, 'welcome_new_sub.txt')
    path = TEMPLATES_DIR / filename
    with open(path, 'r') as f:
        return f.read()


def personalize(template, user):
    return template.replace('{{subscriber_name}}', user.get('name', 'there'))


def onboard_user(user):
    rules = load_rules()
    tiers = load_tiers()
    segment = assign_segment(user, rules)
    if segment != 'New':
        print(f"User {user.get('name')} is not new (segment: {segment}).")
        return None
    tier = assign_tier(user, tiers)
    template = load_template(tier)
    message = personalize(template, user)
    db.update(user['id'], user)
    print(f"Sending {tier} welcome message to {user.get('name')}:")
    return messaging.send_message(user['name'], message)


def main():
    parser = argparse.ArgumentParser(description="Onboard a subscriber")
    parser.add_argument('--id', type=int, default=1, help='Subscriber ID')
    parser.add_argument('--name', required=True, help='Subscriber name')
    parser.add_argument('--days', type=int, default=0, help='Days subscribed')
    parser.add_argument('--spend', type=float, default=0.0, help='Total spend')
    args = parser.parse_args()

    user = {'id': args.id, 'name': args.name, 'days_subscribed': args.days, 'total_spend': args.spend}
    onboard_user(user)


if __name__ == '__main__':
    main()
