import os
import time
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


def query_openrouter(models: list[str], prompt: str) -> dict[str, dict]:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )
    results = {}
    for model in models:
        start = time.time()
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        elapsed = time.time() - start
        results[model] = {
            "response": completion.choices[0].message.content,
            "time_seconds": round(elapsed, 3),
        }
    return results


def get_model_pricing(model: str) -> dict:
    resp = requests.get("https://openrouter.ai/api/v1/models")
    resp.raise_for_status()
    models = resp.json()["data"]
    for m in models:
        if m["id"] == model:
            pricing = m.get("pricing", {})
            return {
                "prompt_per_token": float(pricing.get("prompt", 0)),
                "completion_per_token": float(pricing.get("completion", 0)),
            }
    raise ValueError(f"Model '{model}' not found")
