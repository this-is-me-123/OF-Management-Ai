import os
import openai
from inject_persona_prompt import load_prompts

# Read OpenAI API key from environment
openai.api_key = os.getenv("OPENAI_API_KEY", "")

def simulate_chat_response(tier, message_type):
    prompt = load_prompts(tier=tier, message_type=message_type)
    if not prompt:
        return "No matching prompt found."
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a flirty OnlyFans creator persona."},
            {"role": "user", "content": prompt}
        ]
    )
    return response["choices"][0]["message"]["content"]

# Example usage:
if __name__ == "__main__":
    reply = simulate_chat_response("Engaged", "Reward")
    print("GPT Response:", reply)
