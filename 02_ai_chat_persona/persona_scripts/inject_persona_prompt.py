import json
import random

def load_prompts(filepath="gpt_persona_prompts.jsonl", tier=None, message_type=None):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = [json.loads(line) for line in f]
    if tier:
        lines = [l for l in lines if l["tier"] == tier]
    if message_type:
        lines = [l for l in lines if l["message_type"] == message_type]
    return random.choice(lines)["prompt"] if lines else None

# Example usage:
if __name__ == "__main__":
    prompt = load_prompts(tier="VIP", message_type="Exclusive")
    print(prompt)
