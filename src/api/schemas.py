from pydantic import BaseModel
from typing import Optional


class ProjectCreate(BaseModel):
    name: str


class ProjectResponse(BaseModel):
    id: str
    name: str
    prompt_version_count: int
    model_config_count: int
    test_case_count: int
    run_count: int

    class Config:
        from_attributes = True


class PromptVersionCreate(BaseModel):
    version_number: int
    content: str


class PromptVersionResponse(BaseModel):
    id: str
    project_id: str
    version_number: int
    content: str
    created_at: str

    class Config:
        from_attributes = True


class ModelConfigCreate(BaseModel):
    provider: str
    model_name: str


class ModelConfigResponse(BaseModel):
    id: str
    project_id: str
    provider: str
    model_name: str
    input_cost_per_token: float
    output_cost_per_token: float

    class Config:
        from_attributes = True


class TestCaseCreate(BaseModel):
    prompt_version_id: str
    input_text: str
    expected_output: Optional[str] = None


class TestCaseResponse(BaseModel):
    id: str
    project_id: str
    prompt_version_id: str
    input_text: str
    expected_output: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class RunCreate(BaseModel):
    test_case_id: str
    model_config_ids: Optional[list[str]] = None


class RunResultResponse(BaseModel):
    id: str
    model_config_id: str
    model_name: str
    output_text: str
    latency_ms: float
    prompt_tokens: int
    response_tokens: int
    total_cost: float
    success: bool
    error_message: Optional[str]
    score: float


class RunResponse(BaseModel):
    id: str
    project_id: str
    prompt_version_id: str
    input_text: str
    created_at: str
    results: list[RunResultResponse]

    class Config:
        from_attributes = True


class BatchRunCreate(BaseModel):
    test_case_ids: list[str]
    model_config_ids: Optional[list[str]] = None


class BatchRunResponse(BaseModel):
    runs: list[RunResponse]


class OpenRouterModel(BaseModel):
    id: str
    name: str
    context_length: int
    prompt_cost_per_token: float
    completion_cost_per_token: float
