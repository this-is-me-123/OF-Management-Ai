from flask import request, jsonify
from generate_message import app, TEMPLATE_PATH
import json
from logics.message_logger import log_message
from utils.content_generation import trigger_content_generation, get_latest_asset

@app.route('/send', methods=['POST'])
def send_message():
    data = request.json
    username = data.get("username")
    tier = data.get("tier", "Standard")
    message_type = data.get("message_type", "Welcome")

    with open(TEMPLATE_PATH, 'r') as f:
        templates = json.load(f)
    message = templates.get(tier, {}).get(message_type, "No message available.")

    log_message(username, tier, message_type, message)
    return jsonify({"to": username, "message": message})
