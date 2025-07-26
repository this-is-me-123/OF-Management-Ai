# Script to clean and tokenize DM data for fine-tuning
import json

def preprocess(file_path):
    with open(file_path) as f:
        data = json.load(f)
    return [(x['inbound'], x['response']) for x in data['messages']]
