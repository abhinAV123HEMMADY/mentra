from app.orchestrator.state import LearningState

MODALITY_ORDER = ["analogy", "diagram", "video"]


def next_modality(modality_attempts: list[str]) -> str | None:
    """Real, deterministic re-explanation order (Section 4.5): analogy, then diagram, then video.

    Analogies are cheapest to generate and often enough; diagrams help spatial learners;
    video is the most expensive fallback, so it's tried last. Returns None once all three
    modalities have been attempted.
    """
    for modality in MODALITY_ORDER:
        if modality not in modality_attempts:
            return modality
    return None


def _stub_reexplanation(topic_name: str, modality: str) -> str:
    if modality == "analogy":
        return f"Think of {topic_name} like [a real-world analogy would go here]."
    if modality == "diagram":
        return f"[A diagram illustrating {topic_name} would render here]."
    return f"[A video timestamp for {topic_name} is attached once the Video Curator node runs]"


async def quiz_reexplain_node(state: LearningState) -> dict:
    """Generates a short quiz. STUB: real implementation calls Claude per Section 4.5.

    To demonstrate the modality-escalation order end-to-end without requiring interactive
    input, the first question is seeded as a simulated miss and walked through analogy ->
    diagram; the video slot is filled in later by the Video Curator node via `needs_video`.
    """
    topic_name = state["parsed_objectives"]["topic_name"]

    quiz = [
        {
            "question": f"What is the defining property of {topic_name}?",
            "answer": "See lesson overview.",
            "correct": False,
            "modality_attempts": ["analogy", "diagram"],
            "reexplanations": {
                "analogy": _stub_reexplanation(topic_name, "analogy"),
                "diagram": _stub_reexplanation(topic_name, "diagram"),
            },
            "needs_video": True,
        },
        {
            "question": f"Apply {topic_name} to a simple worked example.",
            "answer": "See worked examples.",
            "correct": True,
            "modality_attempts": [],
            "reexplanations": {},
            "needs_video": False,
        },
    ]
    return {"quiz": quiz}
