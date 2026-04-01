from models.project import Project
from models.prompt_version import PromptVersion
from models.model_config import ModelConfig
from models.test_case import TestCase
from models.run import Run

projects: dict[str, Project] = {}


def get_project(project_id: str) -> Project | None:
    return projects.get(project_id)


def create_project(name: str) -> Project:
    project = Project(name)
    projects[project.id] = project
    return project


def delete_project(project_id: str) -> bool:
    return projects.pop(project_id, None) is not None


def list_projects() -> list[Project]:
    return list(projects.values())
