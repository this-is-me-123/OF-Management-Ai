from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "../message_templates/tiers.json")

@app.route('/generate', methods=['GET'])
def generate_message():
    tier = request.args.get('tier', 'Standard')
    message_type = request.args.get('message_type', 'Welcome')
    with open(TEMPLATE_PATH, 'r') as f:
        templates = json.load(f)
    message = templates.get(tier, {}).get(message_type, "No message available for this tier/type.")
    return jsonify({"message": message})

if __name__ == "__main__":
    app.run(port=5001)
