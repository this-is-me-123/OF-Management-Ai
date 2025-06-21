from flask import jsonify
from generate_message import app
import os
import json

LOG_PATH = os.path.join(os.path.dirname(__file__), "../logs/message_log.jsonl")

@app.route('/logs', methods=['GET'])
def get_logs():
    if not os.path.exists(LOG_PATH):
        return jsonify([])
    with open(LOG_PATH, 'r') as f:
        lines = f.readlines()[-100:]
        entries = [json.loads(line) for line in lines]
    return jsonify(entries)
