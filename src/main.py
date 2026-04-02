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
        ),
        TestCase(
            prompt_version=prompt,
            input_text="My package arrived damaged, what should I do?",
            expected_output="I'm sorry to hear that. Please provide your order number so I can help you file a claim.",
        ),
        TestCase(
            prompt_version=prompt,
            input_text="How long does standard shipping take?",
            expected_output="Standard shipping typically takes 5-7 business days depending on your location.",
        ),
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
            result.evaluate()

            name = result.model_config.model_name
            status = "OK" if result.success else f"FAIL"
            error_info = (
                f"\n    Error: {result.error_message}" if result.error_message else ""
            )

            match_str = "MATCH" if result.quality_score >= 0.7 else "NO MATCH"

            print(f"  Model:    {name}")
            print(f"  Status:   {status}{error_info}")
            print(f"  Score:    {result.quality_score}")
            print(f"  Match:    {match_str}")
            output_display = result.output_text[:120] + "..." if len(result.output_text) > 120 else result.output_text
            print(f'  Output:   "{output_display}"')
            print(f"  Latency:  {result.latency_ms:.1f}ms")
            print(
                f"  Tokens:   {result.prompt_tokens} in / {result.response_tokens} out"
            )
            print(f"  Cost:     ${result.total_cost:.6f}")
            print()


if __name__ == "__main__":
    main()
