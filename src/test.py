from unittest.mock import patch, MagicMock

from models.project import Project
from models.prompt_version import PromptVersion
from models.model_config import ModelConfig
from models.test_case import TestCase
from models.run import Run
from models.run_result import RunResult

project = Project("Test Project")
pv = PromptVersion(version_number=1, content="You are a helpful assistant.")
project.add_prompt_version(pv)
tc = TestCase(
    prompt_version=pv, input_text="Hello", expected_output="A polite greeting"
)
project.add_test_case(tc)
mc = ModelConfig("openrouter", "arcee-ai/trinity-mini:free")
project.add_model_config(mc)
run = Run(project, tc, [mc])
result = RunResult(run, mc)


print(result.run.test_case.prompt_version.content)
result.run.test_case.input_text = "where is my order"
print(result.run.test_case.input_text)
result.output_text = "i will track it for you could you please send your order number?"
result.run.test_case.expected_output = "tone: helpful, doesnt hallucinate results"

print(result.evaluate())
