from __future__ import annotations
from datetime import datetime
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.prompt_version import PromptVersion
    from models.project import Project


@dataclass
class TestCase:
    id: str
    project_id: str
    prompt_version: "PromptVersion"
    prompt_version_id: str
    input_text: str
    expected_output: str | None
    created_at: datetime

    def __init__(
        self,
        prompt_version: "PromptVersion",
        input_text: str,
        expected_output: str | None = None,
    ):
        import uuid

        self.id = str(uuid.uuid4())
        self.project = None
        self.project_id = prompt_version.project_id
        self.prompt_version = prompt_version
        self.prompt_version_id = prompt_version.id
        self.input_text = input_text
        self.expected_output = expected_output
        self.created_at = datetime.now()
