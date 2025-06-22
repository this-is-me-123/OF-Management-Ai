
import requests
import json
import base64
import os
import csv
import random
from pathlib import Path
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText

# Load environment variables from a .env file located next to this script
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)


import sys
prompt_arg = sys.argv[1] if len(sys.argv) > 1 else None
PROMPT_FILE = prompt_arg or "prompt_templates/cover_image_prompts.json"

ASSETS_DIR = "assets"
SD_API_URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"
MANIFEST_PATH = os.path.join(ASSETS_DIR, "asset_manifest.csv")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
RUNWAY_API_KEY = os.environ.get("RUNWAY_API_KEY")

def send_error_email(subject, body):
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
    EMAIL_USER = os.environ.get("EMAIL_USER")
    EMAIL_PASS = os.environ.get("EMAIL_PASS")
    EMAIL_TO = os.environ.get("EMAIL_TO")
    if not all([EMAIL_USER, EMAIL_PASS, EMAIL_TO]):
        print("Email settings not fully set (EMAIL_USER, EMAIL_PASS, EMAIL_TO). Skipping error email.")
        return
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL_USER
        msg["To"] = EMAIL_TO

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, [EMAIL_TO], msg.as_string())
        print("Error email sent.")
    except Exception as e:
        print(f"Error sending email: {e}")

def generate_caption(image_desc, asset_type, label, prompt):
    if not OPENAI_API_KEY:
        print("No OpenAI API key found. Skipping caption generation.")
        return ""
    import openai
    openai.api_key = OPENAI_API_KEY
    caption_prompt = f"Write a short, enticing OnlyFans caption for this {asset_type} image: {image_desc}"
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": caption_prompt}],
            max_tokens=50,
            temperature=0.8,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {e}")
        send_error_email(
            subject=f"OF Content Pipeline Error: Caption ({label})",
            body=f"Error details:\n{e}\nStep: caption generation\nPrompt: {prompt}"
        )
        return ""

def generate_video_runway(prompt, label):
    if not RUNWAY_API_KEY:
        print("Runway API key not found in environment! Skipping video generation.")
        return ""
    video_path = os.path.join(ASSETS_DIR, f"{label}.mp4")
    headers = {
        "Authorization": f"Bearer {RUNWAY_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "num_frames": 16,
        "fps": 8,
        "width": 512,
        "height": 512
    }
    try:
        submit_url = "https://api.runwayml.com/v1/generate/video"
        resp = requests.post(submit_url, headers=headers, json=payload)
        resp.raise_for_status()
        job = resp.json()
        video_url = job.get("video_url")
        if video_url:
            vresp = requests.get(video_url)
            with open(video_path, "wb") as f:
                f.write(vresp.content)
            print(f"Video saved: {video_path}")
            return f"{label}.mp4"
        else:
            print(f"Runway did not return a video_url for {label}")
            send_error_email(
                subject=f"OF Content Pipeline Error: Video ({label})",
                body=f"Runway did not return a video_url for prompt: {prompt}"
            )
            return ""
    except Exception as e:
        print(f"Error generating video for {label} via Runway: {e}")
        send_error_email(
            subject=f"OF Content Pipeline Error: Video ({label})",
            body=f"Error details:\n{e}\nStep: video generation\nPrompt: {prompt}"
        )
        return ""

# Ensure assets directory exists
Path(ASSETS_DIR).mkdir(parents=True, exist_ok=True)

# Load prompts
with open(PROMPT_FILE, "r", encoding="utf-8") as f:
    prompts = json.load(f)

manifest = []
for idx, entry in enumerate(prompts):
    prompt = entry.get("prompt", entry if isinstance(entry, str) else "")
    asset_type = entry.get("asset_type", "cover")
    label = entry.get("output_name", f"{asset_type}_{idx+1}")
    width = int(entry.get("width", 512))
    height = int(entry.get("height", 768 if asset_type == "cover" else 512))
    model = entry.get("model", None)
    seed = entry.get("seed", random.randint(1, 2_000_000_000))

    print(f"Processing {idx+1}/{len(prompts)}: {label} [{asset_type}]")

    image_file, caption, video_file = "", "", ""

    if asset_type in ["cover", "teaser", "image"]:
        payload = {
            "prompt": prompt,
            "steps": 20,
            "width": width,
            "height": height,
            "seed": seed,
        }
        if model:
            payload["override_settings"] = {"sd_model_checkpoint": model}
        try:
            response = requests.post(SD_API_URL, json=payload, timeout=120)
            response.raise_for_status()
            img_b64 = response.json()["images"][0]
            img_bytes = base64.b64decode(img_b64)
            image_file = f"{label}.png"
            out_path = os.path.join(ASSETS_DIR, image_file)
            with open(out_path, "wb") as out_file:
                out_file.write(img_bytes)
            print(f"Image saved: {out_path}")
            # Generate and save caption
            caption = generate_caption(prompt, asset_type, label, prompt)
            if caption:
                caption_path = os.path.join(ASSETS_DIR, f"{label}_caption.txt")
                with open(caption_path, "w", encoding="utf-8") as cf:
                    cf.write(caption)
                print(f"Caption saved: {caption_path}")
        except Exception as e:
            print(f"Error generating image {label}: {e}")
            send_error_email(
                subject=f"OF Content Pipeline Error: Image ({label})",
                body=f"Error details:\n{e}\nStep: image generation\nPrompt: {prompt}"
            )

    if asset_type in ["teaser", "video"]:
        video_file = generate_video_runway(prompt, label)

    manifest.append({
        "output_file": image_file,
        "caption_file": f"{label}_caption.txt" if caption else "",
        "video_file": video_file,
        "prompt": prompt,
        "caption": caption,
        "asset_type": asset_type,
        "width": width,
        "height": height,
        "seed": seed,
        "model": model or "default",
    })

# Write manifest CSV
with open(MANIFEST_PATH, "w", newline='', encoding="utf-8") as csvfile:
    fieldnames = ["output_file", "caption_file", "video_file", "prompt", "caption", "asset_type", "width", "height", "seed", "model"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for row in manifest:
        writer.writerow(row)

print(f"All prompts processed. Manifest written to {MANIFEST_PATH}")
