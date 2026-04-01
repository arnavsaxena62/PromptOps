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
                    {"role": "system", "content": self.run.test_case.prompt_version.content},
                    {"role": "user", "content": self.run.test_case.input_text},
                ],
            )
            elapsed_ms = (time.time() - start) * 1000
            self.prompt_tokens = completion.usage.prompt_tokens
            self.response_tokens = completion.usage.completion_tokens
            self.output_text = completion.choices[0].message.content or ""
            self.prompt_cost = self.prompt_tokens * self.model_config.input_cost_per_token
            self.response_cost = self.response_tokens * self.model_config.output_cost_per_token
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
        output_lower = self.output_text.lower()
        expected_lower = expected.lower()
        if expected_lower in output_lower or output_lower in expected_lower:
            self.quality_score = 1.0
        else:
            output_words = set(output_lower.split())
            expected_words = set(expected_lower.split())
            overlap = len(output_words & expected_words)
            total = len(output_words | expected_words)
            self.quality_score = round(overlap / total, 3) if total > 0 else 0.0
        return self.quality_score

    def token_count(self, text: str) -> int:
        enc = tiktoken.encoding_for_model(self.model_config.model_name)
        return len(enc.encode(text))
