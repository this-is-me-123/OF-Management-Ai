import argparse
from persona_scripts.inject_persona_prompt import load_prompts

parser = argparse.ArgumentParser(description="Inject a GPT persona prompt for CRM tier automation.")
parser.add_argument("--tier", required=True, help="Subscriber tier")
parser.add_argument("--message_type", required=True, help="Message type (e.g., Welcome, Reward)")
args = parser.parse_args()

prompt = load_prompts(tier=args.tier, message_type=args.message_type)
print(f"Generated Prompt:\n{prompt}")
