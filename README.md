# PromptOps

A full-stack application for developing, testing, and comparing prompts across multiple AI models. Create prompt versions, run them against different models with test cases, and evaluate results — all from your browser.

## Tech Stack

**Backend**
- Python 3 + FastAPI
- Uvicorn
- OpenAI SDK (via OpenRouter)
- tiktoken, Pydantic, httpx

**Frontend**
- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4 + shadcn/ui
- React Router DOM

## Features

- **Multi-model comparison** — run the same prompt across multiple models simultaneously
- **Test case evaluation** — define input/expected output pairs to validate prompt behavior
- **AI-as-judge scoring** — automatic quality scoring using an LLM evaluator
- **Cost tracking** — per-token pricing fetched from OpenRouter
- **Performance metrics** — latency, token counts, and cost per run
- **Prompt versioning** — iterate on prompts and compare versions

## Getting Started

### Prerequisites

- Python 3.10+
- Node 22
- An [OpenRouter](https://openrouter.ai) API key

### Backend Setup

```bash
cd src
python -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
```

Create a `.env` file in the project root:

```
OPENROUTER_API_KEY=your_key_here
```

Start the API server:

```bash
python server.py
```

The server runs at `http://localhost:8000`. API docs are available at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend
source ~/.nvm/nvm.sh && nvm use 22
npm install
npm run dev
```

### Using as a Python Library

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
    result.evaluate()
    print(f"{result.model_config.model_name}: score={result.quality_score}")
    print(f"  Latency: {result.latency_ms}ms, Cost: ${result.total_cost}")
```

Run `python main.py` from `src/` for a complete example.

## Project Structure

```
src/
├── main.py                  # CLI example script
├── server.py                # FastAPI server entry point
├── api/
│   ├── __init__.py
│   ├── routes.py            # FastAPI endpoints
│   ├── schemas.py           # Pydantic request/response models
│   └── store.py             # In-memory project store
└── models/
    ├── __init__.py
    ├── project.py            # Container for prompts, models, test cases, and runs
    ├── prompt_version.py     # Versioned prompt templates
    ├── model_config.py       # Model configuration with auto-fetched pricing
    ├── test_case.py          # Input/expected output pairs for evaluation
    ├── run.py                # Executes a test case against configured models
    └── run_result.py         # Per-model result with latency, tokens, cost, and output

frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── sidebar.tsx      # Notion-style sidebar
│   │   └── project-grid.tsx
│   ├── hooks/
│   │   ├── use-projects.ts
│   │   ├── use-prompt-versions.ts
│   │   ├── use-model-configs.ts
│   │   ├── use-test-cases.ts
│   │   └── use-runs.ts
│   ├── pages/
│   │   ├── home.tsx             # Project list
│   │   ├── project-workspace.tsx # Main editor workspace
│   │   └── run-detail.tsx       # Run results view
│   └── lib/
│       ├── config.ts
│       └── utils.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/projects` | List / create projects |
| GET/DELETE | `/projects/{id}` | Get / delete a project |
| GET/POST | `/projects/{id}/prompt-versions` | List / create prompt versions |
| GET/POST | `/projects/{id}/model-configs` | List / create model configs |
| GET | `/models` | List available OpenRouter models |
| GET/POST | `/projects/{id}/test-cases` | List / create test cases |
| GET/POST | `/projects/{id}/runs` | List / create evaluation runs |
| GET | `/projects/{id}/runs/{run_id}` | Get run details with results |

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
| `quality_score` | AI-judged quality score (0.0–1.0) |
