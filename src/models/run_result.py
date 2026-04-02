import tiktoken
import os
import time
from openai import OpenAI
from dotenv import load_dotenv
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.run import Run
from models.model_config import ModelConfig

load_dotenv()


@dataclass
class RunResult:
    id: str
    run_id: str
    model_config_id: str
    output_text: str
    latency_ms: float
    prompt_tokens: int
    response_tokens: int
    prompt_cost: float
    response_cost: float
    total_cost: float
    success: bool
    error_message: str | None
    quality_score: float

    def __init__(self, run: "Run", model_config: ModelConfig):
        import uuid

        self.id = str(uuid.uuid4())
        self.run_id = run.id
        self.model_config_id = model_config.id
        self.run = run
        self.model_config = model_config
        self.output_text = ""
        self.latency_ms = 0.0
        self.prompt_tokens = 0
        self.response_tokens = 0
        self.prompt_cost = 0.0
        self.response_cost = 0.0
        self.total_cost = 0.0
        self.success = False
        self.error_message = None
        self.quality_score = 0.0

    def execute(self) -> None:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        start = time.time()

        try:
            completion = client.chat.completions.create(
                model=self.model_config.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": self.run.test_case.prompt_version.content,
                    },
                    {"role": "user", "content": self.run.test_case.input_text},
                ],
            )

            elapsed_ms = (time.time() - start) * 1000

            self.prompt_tokens = completion.usage.prompt_tokens
            self.response_tokens = completion.usage.completion_tokens
            self.output_text = completion.choices[0].message.content or ""
            self.prompt_cost = (
                self.prompt_tokens * self.model_config.input_cost_per_token
            )
            self.response_cost = (
                self.response_tokens * self.model_config.output_cost_per_token
            )
            self.total_cost = round(self.prompt_cost + self.response_cost, 6)
            self.latency_ms = round(elapsed_ms, 2)
            self.success = True

        except Exception as e:
            elapsed_ms = (time.time() - start) * 1000
            self.latency_ms = round(elapsed_ms, 2)
            self.success = False
            self.error_message = str(e)

    def evaluate(self) -> float:
        expected = self.run.test_case.expected_output
        if not expected or not self.output_text:
            self.quality_score = 0.0
            return self.quality_score

        judge_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )

        judge_prompt = (
            "You are an impartial evaluator. You will be given:\n"
            "1. A system prompt that was used\n"
            "2. A user input that was sent\n"
            "3. The actual output produced by a model\n"
            "4. Expected output criteria (describing tone, style, content requirements, etc.)\n\n"
            "Score how well the actual output meets the expected criteria on a scale from 0.0 to 1.0.\n"
            "A score of 1.0 means it fully meets all criteria. A score of 0.0 means it fails completely.\n"
            "Respond with ONLY a number between 0.0 and 1.0, nothing else.\n\n"
            f"System prompt: {self.run.test_case.prompt_version.content}\n\n"
            f"User input: {self.run.test_case.input_text}\n\n"
            f"Actual output: {self.output_text}\n\n"
            f"Expected criteria: {expected}"
        )

        try:
            response = judge_client.chat.completions.create(
                model="qwen/qwen3.6-plus:free",
                messages=[{"role": "user", "content": judge_prompt}],
                temperature=0.0,
                max_tokens=200,
            )
            score_text = response.choices[0].message.content.strip()
            print(score_text)
            score = float(score_text)
            score = max(0.0, min(1.0, score))
            self.quality_score = round(score, 3)
        except Exception:
            print("evaluation failed")
            self.quality_score = 0.0

        return self.quality_score

    def token_count(self, text: str) -> int:
        enc = tiktoken.encoding_for_model(self.model_config.model_name)
        return len(enc.encode(text))
