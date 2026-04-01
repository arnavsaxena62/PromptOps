import requests
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.project import Project


@dataclass
class ModelConfig:
    id: str
    project_id: str
    provider: str
    model_name: str
    input_cost_per_token: float
    output_cost_per_token: float

    def __init__(self, provider: str, model_name: str):
        import uuid
        self.id = str(uuid.uuid4())
        self.project = None
        self.project_id = ""
        self.provider = provider
        self.model_name = model_name
        self.input_cost_per_token, self.output_cost_per_token = self.fetch_pricing()

    def fetch_pricing(self) -> tuple:
        resp = requests.get("https://openrouter.ai/api/v1/models")
        resp.raise_for_status()
        models = resp.json()["data"]
        for m in models:
            if m["id"] == self.model_name:
                pricing = m.get("pricing", {})
                return (
                    float(pricing.get("prompt", 0)),
                    float(pricing.get("completion", 0)),
                )
        raise ValueError(f"Model '{self.model_name}' not found")
