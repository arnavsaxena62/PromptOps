from datetime import datetime
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from models.test_case import TestCase
from models.run import Run


@dataclass
class Project:
    id: str
    name: str
    prompt_versions: list
    model_configs: list
    test_cases: list
    runs: list[Run]

    def __init__(self, name: str):
        import uuid
        self.id = str(uuid.uuid4())
        self.name = name
        self.prompt_versions = []
        self.model_configs = []
        self.test_cases = []
        self.runs = []

    def add_prompt_version(self, prompt_version) -> None:
        if any(pv.version_number == prompt_version.version_number for pv in self.prompt_versions):
            raise ValueError(f"Prompt version {prompt_version.version_number} already exists")
        prompt_version.project = self
        prompt_version.project_id = self.id
        self.prompt_versions.append(prompt_version)

    def add_model_config(self, model_config) -> None:
        if any(mc.provider == model_config.provider and mc.model_name == model_config.model_name for mc in self.model_configs):
            raise ValueError(f"Model config {model_config.provider}/{model_config.model_name} already exists")
        model_config.project = self
        model_config.project_id = self.id
        self.model_configs.append(model_config)

    def add_test_case(self, test_case) -> None:
        test_case.project = self
        test_case.project_id = self.id
        self.test_cases.append(test_case)

    def create_run(self, test_case: "TestCase", model_configs: Optional[list] = None) -> Run:
        configs = model_configs or self.model_configs
        run = Run(self, test_case, configs)
        run.execute()
        self.runs.append(run)
        return run
