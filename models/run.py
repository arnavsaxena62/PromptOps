from __future__ import annotations
from datetime import datetime
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.test_case import TestCase
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

    def __init__(self, project: "Project", test_case: "TestCase", model_configs: list["ModelConfig"]):
        import uuid
        self.id = str(uuid.uuid4())
        self.project = project
        self.project_id = project.id
        self.test_case = test_case
        self.prompt_version_id = test_case.prompt_version_id
        self.input_text = test_case.input_text
        self.model_configs = model_configs
        self.created_at = datetime.now()
        self.results = []

    def execute(self) -> list[RunResult]:
        for config in self.model_configs:
            result = RunResult(self, config)
            result.execute()
            self.results.append(result)
        return self.results
