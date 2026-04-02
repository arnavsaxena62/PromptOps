# PromptOps

A web application for developing, testing, and comparing prompts across multiple AI models. Create prompt versions, run them against different models with test cases, and find the best model for your use case — all from your browser.

> **Note:** The web UI is under development. The core engine is fully functional and can be used as a Python library today.

## Features

- **Multi-model comparison** — run the same prompt across multiple models simultaneously
- **Test case evaluation** — define input/expected output pairs to validate prompt behavior
- **Cost tracking** — automatic per-token pricing fetched from OpenRouter
- **Performance metrics** — latency, token counts, and cost per run
- **Prompt versioning** — iterate on prompts and compare versions

## Using as a Python Library

### Setup

```bash
python -m venv venv
source venv/bin/activate
pip install openai python-dotenv tiktoken requests
```

Create a `.env` file with your OpenRouter API key:

```
OPENROUTER_API_KEY=your_key_here
```

### Quick Start

```python
from models import Project, PromptVersion, ModelConfig, TestCase

project = Project("My Chatbot")

project.add_model_config(ModelConfig("openrouter", "openai/gpt-4o-mini"))
project.add_model_config(ModelConfig("openrouter", "anthropic/claude-3.5-haiku"))

prompt = PromptVersion(version_number=1, content="You are a helpful assistant...")
project.add_prompt_version(prompt)

test_case = TestCase(
    prompt_version=prompt,
    input_text="What is your return policy?",
    expected_output="You can return items within 30 days...",
)
project.add_test_case(test_case)

run = project.create_run(test_case)
for result in run.results:
    print(f"{result.model_config.model_name}: {result.output_text}")
    print(f"  Latency: {result.latency_ms}ms, Cost: ${result.total_cost}")
```

Run `python main.py` for a complete example with multiple test cases.

## Project Structure

```
models/
├── project.py         # Container for prompts, models, test cases, and runs
├── prompt_version.py  # Versioned prompt templates
├── model_config.py    # Model configuration with auto-fetched pricing
├── test_case.py       # Input/expected output pairs for evaluation
├── run.py             # Executes a test case against configured models
└── run_result.py      # Per-model result with latency, tokens, cost, and output
```

## RunResult Metrics

Each `RunResult` tracks:

| Metric | Description |
|--------|-------------|
| `output_text` | Full model response |
| `latency_ms` | Time to receive response |
| `prompt_tokens` | Tokens in the request |
| `response_tokens` | Tokens in the response |
| `total_cost` | Combined input + output cost |
| `success` | Whether the API call succeeded |
