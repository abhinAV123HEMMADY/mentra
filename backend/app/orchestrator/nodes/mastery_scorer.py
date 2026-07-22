import uuid

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.config import settings
from app.database import async_session
from app.models import MasteryScore, ProtegeSession, StruggleEvent
from app.orchestrator.state import LearningState

QUIZ_WEIGHT = 0.35
FLASHCARD_WEIGHT = 0.25
PROTEGE_WEIGHT = 0.40  # teach-back is a generative demonstration of understanding, harder to
# fake than recognizing a correct quiz option or self-rating confidence — weighted highest
# of the three signals (Section 9.5).


def _compute_mastery(
    quiz: list[dict], confidence_ratings: dict[str, int], protege_score: float | None = None
) -> tuple[float, str | None]:
    """Real scoring logic (Section 4.7, 9.5) — no LLM call.

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

    if protege_score is None:
        # No Protégé Mode session for this learner/topic yet — renormalize across the other
        # two signals so its absence doesn't silently cap the achievable score.
        quiz_w = QUIZ_WEIGHT / (QUIZ_WEIGHT + FLASHCARD_WEIGHT)
        card_w = FLASHCARD_WEIGHT / (QUIZ_WEIGHT + FLASHCARD_WEIGHT)
        mastery_score = quiz_accuracy * quiz_w + (1 - calibration_penalty) * card_w
    else:
        mastery_score = (
            quiz_accuracy * QUIZ_WEIGHT
            + (1 - calibration_penalty) * FLASHCARD_WEIGHT
            + protege_score * PROTEGE_WEIGHT
        )

    mastery_score = max(0.0, mastery_score)

    struggle_type = None
    if strong_struggle or mastery_score < settings.gap_threshold:
        struggle_type = "quiz_miss" if quiz_accuracy < 0.5 else "low_confidence_correct"

    return round(mastery_score, 3), struggle_type


async def _latest_protege_score(db, learner_id: str, topic_id: str) -> float | None:
    stmt = (
        select(ProtegeSession.understanding_score)
        .where(
            ProtegeSession.learner_id == learner_id,
            ProtegeSession.topic_id == topic_id,
            ProtegeSession.status.in_(["completed", "published"]),
        )
        .order_by(ProtegeSession.created_at.desc())
        .limit(1)
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def mastery_scorer_node(state: LearningState) -> dict:
    topic_id = state["parsed_objectives"]["topic_id"]
    learner_id = state["learner_id"]

    async with async_session() as db:
        protege_score = await _latest_protege_score(db, learner_id, topic_id)
        mastery_score, struggle_type = _compute_mastery(
            state.get("quiz", []), state.get("confidence_ratings", {}), protege_score
        )

        struggle_signal = None
        if struggle_type:
            struggle_signal = {
                "user_id": learner_id,
                "topic_id": topic_id,
                "signal_type": struggle_type,
                "severity": round(1 - mastery_score, 3),
            }

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
