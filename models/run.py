from __future__ import annotations
from datetime import datetime
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.prompt_version import PromptVersion
    from models.model_config import ModelConfig
    from models.project import Project
from models.run_result import RunResult


@dataclass
class Run:
    id: str
    project_id: str
    prompt_version_id: str
    input_text: str
    created_at: datetime
    results: list[RunResult]

    def __init__(self, project: "Project", prompt_version: "PromptVersion", model_configs: list["ModelConfig"]):
        import uuid
        self.id = str(uuid.uuid4())
        self.project = project
        self.project_id = project.id
        self.prompt_version = prompt_version
        self.prompt_version_id = prompt_version.id
        self.input_text = prompt_version.content
        self.model_configs = model_configs
        self.created_at = datetime.now()
        self.results = []

    def execute(self) -> list[RunResult]:
        for config in self.model_configs:
            result = RunResult(self, config)
            result.execute()
            self.results.append(result)
        return self.results
