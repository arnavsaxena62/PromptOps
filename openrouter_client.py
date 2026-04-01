import os
from openai import OpenAI
from dotenv import load_dotenv


load_dotenv()


def query_openrouter(models: list[str], prompt: str) -> dict[str, str]:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )
    results = {}
    for model in models:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        results[model] = completion.choices[0].message.content
    return results
