from models.project import Project
from models.prompt_version import PromptVersion
from models.model_config import ModelConfig
from models.test_case import TestCase


def main():
    project = Project("Delivery Chatbot")

    project.add_model_config(
        ModelConfig("openrouter", "qwen/qwen3.6-plus-preview:free")
    )
    project.add_model_config(ModelConfig("openrouter", "z-ai/glm-4.5-air:free"))

    prompt = PromptVersion(
        version_number=1,
        content=(
            "You are a helpful delivery assistant chatbot. "
            "Your job is to help customers track their orders, "
            "handle delivery complaints, and provide shipping updates. "
            "Always be polite, concise, and helpful. "
            "If you cannot resolve an issue, offer to escalate to a human agent."
        ),
    )
    project.add_prompt_version(prompt)

    test_cases = [
        TestCase(
            prompt_version=prompt,
            input_text="Where is my order #12345?",
            expected_output="I can help you track your order. Let me look up order #12345 for you.",
        )
    ]

    for tc in test_cases:
        project.add_test_case(tc)

    print(f"Project: {project.name}")
    print(f"Models: {[m.model_name for m in project.model_configs]}")
    print(f"Test cases: {len(project.test_cases)}")
    print("=" * 80)

    for tc in project.test_cases:
        print(f"\nTest case input:    '{tc.input_text}'")
        print(f"Expected output:  '{tc.expected_output}'")
        print("-" * 80)

        run = project.create_run(tc)

        for result in run.results:
            name = result.model_config.model_name
            status = "OK" if result.success else f"FAIL"
            error_info = (
                f"\n    Error: {result.error_message}" if result.error_message else ""
            )

            expected_lower = (tc.expected_output or "").lower()
            output_lower = result.output_text.lower()
            match = expected_lower in output_lower or output_lower in expected_lower
            match_str = "MATCH" if match else "NO MATCH"

            print(f"  Model:    {name}")
            print(f"  Status:   {status}{error_info}")
            print(f"  Match:    {match_str}")
            print(f'  Output:   "{result.output_text}"')
            print(f"  Latency:  {result.latency_ms:.1f}ms")
            print(
                f"  Tokens:   {result.prompt_tokens} in / {result.response_tokens} out"
            )
            print(f"  Cost:     ${result.total_cost:.6f}")
            print()


if __name__ == "__main__":
    main()
