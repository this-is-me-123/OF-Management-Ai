import json
import random
import os

def load_prompts(filepath=None, tier=None, message_type=None):
    if filepath is None:
        # Load from the same folder this script is in
        base_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(base_dir, "gpt_persona_prompts.jsonl")

    print(f"📄 Loading prompt file from: {filepath}")  # Debugging output

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = [json.loads(line) for line in f]
    if tier:
        lines = [l for l in lines if l["tier"] == tier]
    if message_type:
        lines = [l for l in lines if l["message_type"] == message_type]
    return random.choice(lines)["prompt"] if lines else None
