from app.orchestrator.state import LearningState


async def lesson_generator_node(state: LearningState) -> dict:
    """Produces a structured lesson: overview, worked examples, common mistakes.

    STUB: real implementation calls the Claude API (see Section 4.4) with a prompt constrained
    to this JSON shape so the frontend can render each section as it streams in. The shape below
    matches what that real call would return, so downstream nodes and the UI don't need to change
    when the stub is swapped for a live call.
    """
    topic_name = state["parsed_objectives"]["topic_name"]

    lesson = {
        "topic_name": topic_name,
        "overview": f"{topic_name} builds on a small set of core ideas. This lesson walks "
        f"through the definition, a worked example, and the mistakes learners most often make.",
        "worked_examples": [
            {
                "difficulty": "easy",
                "prompt": f"A basic {topic_name} example.",
                "solution": "Step-by-step solution would go here.",
            },
            {
                "difficulty": "medium",
                "prompt": f"A more involved {topic_name} example.",
                "solution": "Step-by-step solution would go here.",
            },
        ],
        "common_mistakes": [
            f"Forgetting a key step specific to {topic_name}.",
            "Applying the right method to the wrong part of the problem.",
        ],
    }
    return {"lesson": lesson}
