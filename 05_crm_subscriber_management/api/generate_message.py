from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "../message_templates/tiers.json")

from utils.content_generation import trigger_content_generation, get_latest_asset

@app.route('/generate', methods=['GET'])
def generate_message():
    tier = request.args.get('tier', 'Standard')
    message_type = request.args.get('message_type', 'Welcome')
    with open(TEMPLATE_PATH, 'r') as f:
        templates = json.load(f)
    message = templates.get(tier, {}).get(message_type, "No message available for this tier/type.")
    return jsonify({"message": message})

@app.route('/campaign', methods=['POST'])
def campaign_message():
    data = request.json
    username = data.get("username")
    tier = data.get("tier", "Standard")
    message_type = data.get("message_type", "Campaign")
    # 1. Trigger content generation
    gen_result = trigger_content_generation()
    asset = get_latest_asset()
    # 2. Compose campaign message with generated asset
    message = f"Special campaign for {username}! Enjoy new content."
    asset_path = asset['image_path'] if asset and 'image_path' in asset else None
    # Real delivery: log or send to downstream system
    print(f"[DELIVERY] Campaign to: {username}, Message: {message}, Asset: {asset_path}")
    return jsonify({"to": username, "message": message, "asset": asset_path, "generation": gen_result})

if __name__ == "__main__":
    app.run(port=5001)
