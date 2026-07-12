import uuid

from app.database import async_session
from app.models import Flashcard, Lesson, QuizAttempt
from app.orchestrator.state import LearningState


async def stream_result_node(state: LearningState) -> dict:
    """Terminal node: persists the completed learning package.

    Per-node WebSocket streaming itself happens in the Celery task (app/tasks.py), which
    publishes to Redis after every graph node completes — this node's job is just to make
    the final package durable once the pipeline has finished.
    """
    lesson_id = str(uuid.uuid4())

    async with async_session() as db:
        db.add(
            Lesson(
                id=lesson_id,
                topic_id=state["parsed_objectives"]["topic_id"],
                learner_id=state["learner_id"],
                content_json=state["lesson"],
            )
        )
        # No relationship() is declared between Lesson and QuizAttempt/Flashcard, so SQLAlchemy
        # won't auto-order the inserts across tables — flush the parent row first or the
        # child inserts can be emitted before it and violate the lesson_id FK.
        await db.flush()

        for question in state.get("quiz", []):
            db.add(
                QuizAttempt(
                    id=str(uuid.uuid4()),
                    lesson_id=lesson_id,
                    question=question["question"],
                    correct=question["correct"],
                    modality_used=(question["modality_attempts"][-1] if question.get("modality_attempts") else None),
                )
            )
        persisted_flashcards = []
        for card in state.get("flashcards", []):
            card_id = str(uuid.uuid4())
            db.add(
                Flashcard(
                    id=card_id,
                    lesson_id=lesson_id,
                    front=card["front"],
                    back=card["back"],
                    stability=card["stability"],
                    difficulty=card["difficulty"],
                    elapsed_days=card["elapsed_days"],
                )
            )
            persisted_flashcards.append({**card, "id": card_id})
        await db.commit()

    return {"lesson": {**state["lesson"], "lesson_id": lesson_id}, "flashcards": persisted_flashcards}
