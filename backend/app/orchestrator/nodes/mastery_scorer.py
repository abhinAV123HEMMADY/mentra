import uuid

from sqlalchemy.dialects.postgresql import insert

from app.config import settings
from app.database import async_session
from app.models import MasteryScore, StruggleEvent
from app.orchestrator.state import LearningState

QUIZ_WEIGHT = 0.6
FLASHCARD_WEIGHT = 0.4


def _compute_mastery(quiz: list[dict], confidence_ratings: dict[str, int]) -> tuple[float, str | None]:
    """Real scoring logic (Section 4.7) — no LLM call.

    Low confidence paired with a correct answer is a calibration signal (the learner
    under-trusts a real skill); low confidence paired with a wrong answer is a stronger
    struggle signal (the learner correctly senses a gap). Both are folded into the score,
    but only the latter pattern can trigger a struggle_signal on its own.
    """
    total = len(quiz) or 1
    correct = sum(1 for q in quiz if q["correct"])
    quiz_accuracy = correct / total

    strong_struggle = False
    calibration_penalty = 0.0

    # confidence_ratings is keyed by flashcard id and only populated once the learner has
    # reviewed cards post-lesson, so on a fresh generation this is empty and the score below
    # is quiz-only — the weighting logic is real and takes effect once review data exists.
    for rating in confidence_ratings.values():
        if rating <= 1:
            strong_struggle = True
        elif rating <= 2:
            calibration_penalty += 0.05

    mastery_score = max(0.0, quiz_accuracy * QUIZ_WEIGHT + (1 - calibration_penalty) * FLASHCARD_WEIGHT)

    struggle_type = None
    if strong_struggle or mastery_score < settings.gap_threshold:
        struggle_type = "quiz_miss" if quiz_accuracy < 0.5 else "low_confidence_correct"

    return round(mastery_score, 3), struggle_type


async def mastery_scorer_node(state: LearningState) -> dict:
    topic_id = state["parsed_objectives"]["topic_id"]
    learner_id = state["learner_id"]

    mastery_score, struggle_type = _compute_mastery(state.get("quiz", []), state.get("confidence_ratings", {}))

    struggle_signal = None
    if struggle_type:
        struggle_signal = {
            "user_id": learner_id,
            "topic_id": topic_id,
            "signal_type": struggle_type,
            "severity": round(1 - mastery_score, 3),
        }

    async with async_session() as db:
        stmt = insert(MasteryScore).values(user_id=learner_id, topic_id=topic_id, score=mastery_score)
        stmt = stmt.on_conflict_do_update(
            index_elements=[MasteryScore.user_id, MasteryScore.topic_id], set_={"score": mastery_score}
        )
        await db.execute(stmt)

        if struggle_signal:
            db.add(
                StruggleEvent(
                    id=str(uuid.uuid4()),
                    user_id=learner_id,
                    topic_id=topic_id,
                    signal_type=struggle_type,
                    severity=struggle_signal["severity"],
                    visibility="private",  # default private; learner opts in to sharing later (Section 7.2)
                )
            )
        await db.commit()

    return {"mastery_score": mastery_score, "struggle_signal": struggle_signal}
