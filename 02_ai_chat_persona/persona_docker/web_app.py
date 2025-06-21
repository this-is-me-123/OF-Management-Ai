from flask import Flask, request, jsonify
import sys
import os
import traceback

# Add persona_scripts to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "persona_scripts")))

# Verify file exists
prompt_file_path = os.path.join("persona_scripts", "gpt_persona_prompts.jsonl")
print(f"📂 Checking file exists at: {prompt_file_path}")
print(f"📁 Current working directory: {os.getcwd()}")
print(f"📂 Contents of ./persona_scripts/: {os.listdir('./persona_scripts')}")

# Try importing the loader
try:
    from inject_persona_prompt import load_prompts
except Exception as e:
    print("🚨 Failed to import inject_persona_prompt")
    traceback.print_exc()

app = Flask(__name__)
app.config['DEBUG'] = True

@app.route('/generate', methods=['GET'])
def generate():
    try:
        tier = request.args.get('tier')
        message_type = request.args.get('message_type')
        print(f"📥 Received request: tier={tier}, message_type={message_type}")

        if not tier or not message_type:
            return jsonify({"error": "Missing tier or message_type parameter"}), 400

        prompt = load_prompts(tier=tier, message_type=message_type)
        print(f"✅ Loaded prompt:\n{prompt}")

        if not prompt:
            return jsonify({"error": "No matching prompt found"}), 404

        return jsonify({"prompt": prompt})

    except Exception as e:
        print("💥 Exception occurred during /generate:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
