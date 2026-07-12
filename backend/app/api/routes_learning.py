import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.fsrs.scheduler import fsrs_update
from app.models import ConfidenceRating, Flashcard
from app.schemas.learning import ConfidenceSubmission, LearnAccepted, LearnRequest
from app.tasks import run_learning_pipeline

router = APIRouter(prefix="/learn", tags=["learning"])


@router.post("", response_model=LearnAccepted)
async def start_learning(req: LearnRequest):
    session_id = str(uuid.uuid4())
    run_learning_pipeline.delay(session_id, req.learner_id, req.topic_input, req.input_mode)
    return LearnAccepted(session_id=session_id)


@router.post("/confidence")
async def submit_confidence(payload: ConfidenceSubmission, db: AsyncSession = Depends(get_db)):
    """Applies a real FSRS update to the reviewed card and records the pre-reveal confidence rating."""
    card = await db.get(Flashcard, payload.card_id)
    if card is None:
        return {"error": "card not found"}

    updated = fsrs_update(
        {"stability": card.stability, "difficulty": card.difficulty, "elapsed_days": card.elapsed_days},
        payload.rating,
        payload.recalled,
    )
    card.stability = updated["stability"]
    card.difficulty = updated["difficulty"]
    card.elapsed_days = 0
    card.due_date = datetime.utcnow() + timedelta(days=updated["next_interval_days"])

    db.add(
        ConfidenceRating(
            id=str(uuid.uuid4()),
            card_id=payload.card_id,
            learner_id=payload.learner_id,
            rating=payload.rating,
        )
    )
    await db.commit()

    return {"status": "ok", "next_due_days": updated["next_interval_days"]}
