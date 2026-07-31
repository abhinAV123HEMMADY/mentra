"""Quiz + Re-explanation Agent (Section 4.5).

The modality-escalation order is real and deterministic: analogy, then diagram, then video.
Analogies are cheapest to generate and often enough; diagrams help spatial learners; video
is the most expensive fallback, so it's tried last.

Live path: Claude writes the quiz and the analogy/diagram re-explanations in one forced-tool
call. To demonstrate the escalation end-to-end without interactive input, the first question
is seeded as a simulated miss and walked through analogy -> diagram; the video slot is filled
in later by the Video Curator node via `needs_video` — same convention as the stub.
"""

from app.llm import forced_tool_call
from app.orchestrator.state import LearningState

MODALITY_ORDER = ["analogy", "diagram", "video"]


def next_modality(modality_attempts: list[str]) -> str | None:
    """Returns the next untried re-explanation modality, or None once all three are spent."""
    for modality in MODALITY_ORDER:
        if modality not in modality_attempts:
            return modality
    return None


_QUIZ_TOOL = {
    "name": "write_quiz",
    "description": "Write the quiz and the re-explanations for the first question.",
    "input_schema": {
        "type": "object",
        "properties": {
            "questions": {
                "type": "array",
                "minItems": 2,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "answer": {"type": "string", "description": "The full correct answer, concise."},
                    },
                    "required": ["question", "answer"],
                },
            },
            "analogy": {
                "type": "string",
                "description": "Re-explains the first question's concept through a concrete real-world analogy.",
            },
            "diagram": {
                "type": "string",
                "description": "Re-explains it spatially: a compact text/ASCII diagram with a one-line caption.",
            },
        },
        "required": ["questions", "analogy", "diagram"],
    },
}

_SYSTEM = (
    "You are writing a short comprehension quiz for a lesson the learner just read, plus two "
    "alternative re-explanations of the first question's concept for a learner who missed it: "
    "one analogy-based, one diagram-based. Questions must be answerable from the lesson but "
    "not verbatim lookups. Keep everything tight and specific."
)


def _stub_reexplanation(topic_name: str, modality: str) -> str:
    if modality == "analogy":
        return f"Think of {topic_name} like [a real-world analogy would go here]."
    if modality == "diagram":
        return f"[A diagram illustrating {topic_name} would render here]."
    return f"[A video timestamp for {topic_name} is attached once the Video Curator node runs]"


def _stub_quiz(topic_name: str) -> list[dict]:
    return [
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


async def quiz_reexplain_node(state: LearningState) -> dict:
    topic_name = state["parsed_objectives"]["topic_name"]
    lesson = state.get("lesson") or {}

    prompt = f"Topic: {topic_name}\n\nLesson overview:\n{lesson.get('overview', '(none)')}"
    mistakes = lesson.get("common_mistakes")
    if mistakes:
        prompt += "\n\nCommon mistakes covered:\n" + "\n".join(f"- {m}" for m in mistakes)

    generated = await forced_tool_call(_SYSTEM, prompt, _QUIZ_TOOL)
    if generated is None:
        return {"quiz": _stub_quiz(topic_name)}

    quiz = []
    for i, q in enumerate(generated["questions"]):
        first = i == 0  # seeded miss: walks the escalation ladder analogy -> diagram -> video
        quiz.append(
            {
                "question": q["question"],
                "answer": q["answer"],
                "correct": not first,
                "modality_attempts": ["analogy", "diagram"] if first else [],
                "reexplanations": {
                    "analogy": generated["analogy"],
                    "diagram": generated["diagram"],
                }
                if first
                else {},
                "needs_video": first,
            }
        )
    return {"quiz": quiz}
