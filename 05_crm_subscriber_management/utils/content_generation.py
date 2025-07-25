import requests
import csv

def trigger_content_generation(prompt_file="prompt_templates/cover_image_prompts.json"):
    url = "http://127.0.0.1:5001/generate-assets"
    payload = {"prompt_file": prompt_file}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

def get_latest_asset():
    try:
        with open("assets/asset_manifest.csv", "r", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
            if rows:
                return rows[-1]  # Most recent asset
    except Exception as e:
        print("Error reading asset manifest:", e)
    return None
