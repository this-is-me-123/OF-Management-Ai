
from flask import Flask, request, jsonify
import subprocess
import os

app = Flask(__name__)

@app.route("/generate-assets", methods=["POST"])
def generate_assets():
    prompt_file = request.json.get("prompt_file", "prompt_templates/cover_image_prompts.json")
    try:
        result = subprocess.run(
            ["python", "pipeline_prototype/prompt_to_image.py", prompt_file],
            capture_output=True, text=True, timeout=1800
        )
        if result.returncode == 0:
            return jsonify({"status": "success", "output": result.stdout})
        else:
            return jsonify({"status": "error", "error": result.stderr}), 500
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/manifest", methods=["GET"])
def get_manifest():
    try:
        with open("assets/asset_manifest.csv", "r", encoding="utf-8") as f:
            csv_data = f.read()
        return csv_data, 200, {"Content-Type": "text/csv"}
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/status", methods=["GET"])
def status():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(port=5001, debug=True)
