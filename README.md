# PromptOps

A tool for developing, testing, and comparing prompts across multiple AI models. Run the same prompt against different models, evaluate outputs with test cases, and find the best model for your use case.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install openai python-dotenv tiktoken requests
```

Create a `.env` file with your OpenRouter API key:

```
OPENROUTER_API_KEY=your_key_here
```

## Usage

See `main.py` for a complete example. The workflow is:

1. **Create a project** — a container for prompts, models, test cases, and runs
2. **Add model configs** — specify which models to test (pricing is fetched automatically from OpenRouter)
3. **Create a prompt version** — the system prompt template you want to evaluate
4. **Add test cases** — pairs of input text and expected output for each prompt
5. **Run and compare** — execute all test cases against all models and review results

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
