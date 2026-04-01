from datetime import datetime
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from models.project import Project
from models.run import Run


@dataclass
class Project:
    id: str
    name: str
    prompt_versions: list
    model_configs: list
    runs: list[Run]

    def __init__(self, name: str):
        import uuid

        self.id = str(uuid.uuid4())
        self.name = name
        self.prompt_versions = []
        self.model_configs = []
        self.runs = []

    def add_prompt_version(self, prompt_version) -> None:
        prompt_version.project = self
        prompt_version.project_id = self.id
        self.prompt_versions.append(prompt_version)

    def add_model_config(self, model_config) -> None:
        model_config.project = self
        model_config.project_id = self.id
        self.model_configs.append(model_config)

    def create_run(self, prompt_version, model_configs: Optional[list] = None) -> Run:
        configs = model_configs or self.model_configs
        run = Run(self, prompt_version, configs)
        run.execute()
        self.runs.append(run)
        return run
