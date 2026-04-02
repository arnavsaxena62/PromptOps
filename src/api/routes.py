from fastapi import FastAPI, HTTPException
from typing import Optional
import requests
from api.store import (
    create_project,
    delete_project,
    get_project,
    list_projects,
)
from models.prompt_version import PromptVersion
from models.model_config import ModelConfig
from models.test_case import TestCase
from api.schemas import (
    ProjectCreate,
    ProjectResponse,
    PromptVersionCreate,
    PromptVersionResponse,
    ModelConfigCreate,
    ModelConfigResponse,
    TestCaseCreate,
    TestCaseResponse,
    RunCreate,
    RunResponse,
    RunResultResponse,
    OpenRouterModel,
)

app = FastAPI(title="PromptOps", description="Prompt development and model comparison API")


@app.get("/projects", response_model=list[ProjectResponse])
def get_all_projects():
    return [_project_to_response(p) for p in list_projects()]


@app.post("/projects", response_model=ProjectResponse)
def create_new_project(body: ProjectCreate):
    project = create_project(body.name)
    return _project_to_response(project)


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project_details(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return _project_to_response(project)


@app.delete("/projects/{project_id}")
def remove_project(project_id: str):
    if not delete_project(project_id):
        raise HTTPException(404, "Project not found")
    return {"deleted": True}


@app.post("/projects/{project_id}/prompt-versions", response_model=PromptVersionResponse)
def add_prompt_version(project_id: str, body: PromptVersionCreate):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    try:
        pv = PromptVersion(version_number=body.version_number, content=body.content)
        project.add_prompt_version(pv)
    except ValueError as e:
        raise HTTPException(409, str(e))
    return _pv_to_response(pv)


@app.get("/projects/{project_id}/prompt-versions", response_model=list[PromptVersionResponse])
def list_prompt_versions(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return [_pv_to_response(pv) for pv in project.prompt_versions]


@app.post("/projects/{project_id}/model-configs", response_model=ModelConfigResponse)
def add_model_config(project_id: str, body: ModelConfigCreate):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    try:
        mc = ModelConfig(provider=body.provider, model_name=body.model_name)
    except ValueError as e:
        raise HTTPException(400, str(e))
    project.add_model_config(mc)
    return _mc_to_response(mc)


@app.get("/projects/{project_id}/model-configs", response_model=list[ModelConfigResponse])
def list_model_configs(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return [_mc_to_response(mc) for mc in project.model_configs]


@app.get("/models", response_model=list[OpenRouterModel])
def list_available_models():
    resp = requests.get("https://openrouter.ai/api/v1/models")
    resp.raise_for_status()
    models = resp.json()["data"]
    result = []
    for m in models:
        pricing = m.get("pricing", {})
        result.append(OpenRouterModel(
            id=m["id"],
            name=m.get("name", m["id"]),
            context_length=m.get("context_length", 0),
            prompt_cost_per_token=float(pricing.get("prompt", 0)),
            completion_cost_per_token=float(pricing.get("completion", 0)),
        ))
    return result


@app.post("/projects/{project_id}/test-cases", response_model=TestCaseResponse)
def add_test_case(project_id: str, body: TestCaseCreate):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    pv = next((p for p in project.prompt_versions if p.id == body.prompt_version_id), None)
    if not pv:
        raise HTTPException(404, "Prompt version not found")
    tc = TestCase(prompt_version=pv, input_text=body.input_text, expected_output=body.expected_output)
    project.add_test_case(tc)
    return _tc_to_response(tc)


@app.get("/projects/{project_id}/test-cases", response_model=list[TestCaseResponse])
def list_test_cases(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return [_tc_to_response(tc) for tc in project.test_cases]


@app.post("/projects/{project_id}/runs", response_model=RunResponse)
def execute_run(project_id: str, body: RunCreate):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    tc = next((t for t in project.test_cases if t.id == body.test_case_id), None)
    if not tc:
        raise HTTPException(404, "Test case not found")
    if body.model_config_ids:
        configs = [mc for mc in project.model_configs if mc.id in body.model_config_ids]
        if not configs:
            raise HTTPException(404, "No matching model configs found")
    else:
        configs = project.model_configs
    if not configs:
        raise HTTPException(400, "No model configs available")
    run = project.create_run(tc, configs)
    for result in run.results:
        result.evaluate()
    return _run_to_response(run)


@app.get("/projects/{project_id}/runs", response_model=list[RunResponse])
def list_runs(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return [_run_to_response(run) for run in project.runs]


@app.get("/projects/{project_id}/runs/{run_id}", response_model=RunResponse)
def get_run(project_id: str, run_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    run = next((r for r in project.runs if r.id == run_id), None)
    if not run:
        raise HTTPException(404, "Run not found")
    return _run_to_response(run)


def _project_to_response(p) -> ProjectResponse:
    return ProjectResponse(
        id=p.id,
        name=p.name,
        prompt_version_count=len(p.prompt_versions),
        model_config_count=len(p.model_configs),
        test_case_count=len(p.test_cases),
        run_count=len(p.runs),
    )


def _pv_to_response(pv) -> PromptVersionResponse:
    return PromptVersionResponse(
        id=pv.id,
        project_id=pv.project_id,
        version_number=pv.version_number,
        content=pv.content,
        created_at=pv.created_at.isoformat(),
    )


def _mc_to_response(mc) -> ModelConfigResponse:
    return ModelConfigResponse(
        id=mc.id,
        project_id=mc.project_id,
        provider=mc.provider,
        model_name=mc.model_name,
        input_cost_per_token=mc.input_cost_per_token,
        output_cost_per_token=mc.output_cost_per_token,
    )


def _tc_to_response(tc) -> TestCaseResponse:
    return TestCaseResponse(
        id=tc.id,
        project_id=tc.project_id,
        prompt_version_id=tc.prompt_version_id,
        input_text=tc.input_text,
        expected_output=tc.expected_output,
        created_at=tc.created_at.isoformat(),
    )


def _run_to_response(run) -> RunResponse:
    return RunResponse(
        id=run.id,
        project_id=run.project_id,
        prompt_version_id=run.prompt_version_id,
        input_text=run.input_text,
        created_at=run.created_at.isoformat(),
        results=[
            RunResultResponse(
                id=r.id,
                model_config_id=r.model_config_id,
                model_name=r.model_config.model_name,
                output_text=r.output_text,
                latency_ms=r.latency_ms,
                prompt_tokens=r.prompt_tokens,
                response_tokens=r.response_tokens,
                total_cost=r.total_cost,
                success=r.success,
                error_message=r.error_message,
            )
            for r in run.results
        ],
    )
