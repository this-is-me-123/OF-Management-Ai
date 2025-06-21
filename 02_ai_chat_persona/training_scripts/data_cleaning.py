# data_cleaning.py

import json

def clean_text(text):
    return text.replace("\n", " ").strip()

with open('raw_dms.json', 'r') as f:
    raw = json.load(f)

cleaned = []
for msg in raw:
    cleaned.append({
        'prompt': f"User: {clean_text(msg['user_text'])}\nAssistant:",
        'completion': f" {clean_text(msg['bot_response'])}"
    })

with open('cleaned_dms.jsonl', 'w', encoding="utf-8") as f:
    for item in cleaned:
        f.write(json.dumps(item) + '\n')

print('cleaned_dms.jsonl created')
