from datetime import datetime
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.project import Project


@dataclass
class PromptVersion:
    id: str
    project_id: str
    version_number: int
    content: str
    created_at: datetime

    def __init__(self, version_number: int, content: str):
        import uuid
        self.id = str(uuid.uuid4())
        self.project = None
        self.project_id = ""
        self.version_number = version_number
        self.content = content
        self.created_at = datetime.now()
