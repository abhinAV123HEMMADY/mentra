import json
import uuid

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import ProtegeSession, QnaPost, Topic
from app.moderation.service import moderate_text
from app.orchestrator.nodes.protege_persona import protege_persona_node
from app.orchestrator.protege_graph import protege_graph
from app.realtime import channel_name
from app.schemas.protege import ChecklistItem, ProtegePublishRequest, ProtegeStartRequest, ProtegeTurnRequest, ProtegeTurnResult

router = APIRouter(prefix="/protege", tags=["protege"])

UNDERSTANDING_THRESHOLD = 0.75


def _checklist_items(misconceptions: list[dict], checklist: dict[str, bool]) -> list[ChecklistItem]:
    return [
        ChecklistItem(id=m["id"], sub_concept=m["sub_concept"], covered=checklist.get(m["id"], False))
        for m in misconceptions
    ]


async def _publish(session_id: str, node: str, update: dict):
    r = redis.from_url(settings.redis_url)
    try:
        await r.publish(channel_name(session_id), json.dumps({"node": node, "update": update}, default=str))
    finally:
        await r.aclose()


@router.post("/start", response_model=ProtegeTurnResult)
async def start_protege_session(req: ProtegeStartRequest, db: AsyncSession = Depends(get_db)):
    """Kicks off a Protégé Mode session: the persona asks its first naive question, seeded
    from the topic's real common misconceptions, before the learner has said anything
    (Section 9.1).
    """
    topic = await db.get(Topic, req.topic_id)
    if topic is None or not topic.common_misconceptions:
        raise HTTPException(status_code=400, detail="topic has no common_misconceptions configured for Protégé Mode")

    misconceptions = topic.common_misconceptions
    checklist = {m["id"]: False for m in misconceptions}

    state = {
        "topic_id": topic.id,
        "topic_name": topic.name,
        "misconceptions": misconceptions,
        "checklist": checklist,
        "transcript": [],
        "learner_turn": None,
        "understanding_score": 0.0,
        "resolved_misconceptions": [],
        "persona_message": "",
        "status": "active",
        "gave_up_on": None,
    }
    result = await protege_persona_node(state)

    session = ProtegeSession(
        id=str(uuid.uuid4()),
        topic_id=topic.id,
        learner_id=req.learner_id,
        transcript_json=result["transcript"],
        understanding_score=0.0,
        misconceptions_resolved=[],
        status="active",
    )
    db.add(session)
    await db.commit()

    await _publish(session.id, "protege_persona", {"persona_message": result["persona_message"]})

    return ProtegeTurnResult(
        session_id=session.id,
        persona_message=result["persona_message"],
        understanding_score=0.0,
        checklist=_checklist_items(misconceptions, checklist),
        resolved_misconceptions=[],
        status="active",
    )


@router.post("/turn", response_model=ProtegeTurnResult)
async def submit_protege_turn(req: ProtegeTurnRequest, db: AsyncSession = Depends(get_db)):
    """Scores the learner's explanation against the open checklist, then streams the
    persona's next question — same {"node", "update"} WebSocket event shape as the main
    learning pipeline, over the same per-session Redis channel (Section 9.2, 10).
    """
    session = await db.get(ProtegeSession, req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail=f"session is {session.status}, not active")

    topic = await db.get(Topic, session.topic_id)
    misconceptions = topic.common_misconceptions
    checklist = {m["id"]: m["id"] in session.misconceptions_resolved for m in misconceptions}

    state = {
        "topic_id": topic.id,
        "topic_name": topic.name,
        "misconceptions": misconceptions,
        "checklist": checklist,
        "transcript": session.transcript_json,
        "learner_turn": req.learner_explanation,
        "understanding_score": session.understanding_score,
        "resolved_misconceptions": list(session.misconceptions_resolved),
        "persona_message": "",
        "status": "active",
        "gave_up_on": None,
    }

    merged: dict = {}
    async for step in protege_graph.astream(state):
        for node_name, update in step.items():
            merged.update(update)
            await _publish(session.id, node_name, update)

    session.transcript_json = merged["transcript"]
    session.understanding_score = merged["understanding_score"]
    session.misconceptions_resolved = merged["resolved_misconceptions"]
    if merged["understanding_score"] >= UNDERSTANDING_THRESHOLD or merged["status"] == "completed":
        session.status = "completed"
    await db.commit()

    return ProtegeTurnResult(
        session_id=session.id,
        persona_message=merged["persona_message"],
        understanding_score=merged["understanding_score"],
        checklist=_checklist_items(misconceptions, merged["checklist"]),
        resolved_misconceptions=merged["resolved_misconceptions"],
        status=session.status,
    )


@router.post("/publish")
async def publish_protege_explanation(req: ProtegePublishRequest, db: AsyncSession = Depends(get_db)):
    """On publish, the transcript is screened by the same Moderation Service as any other
    Q&A post, then lands in the topic-scoped feed tagged as a Protégé-Mode explanation so
    other learners can see how a peer taught their way through the same misconceptions
    (Section 9.4, 7.2).
    """
    session = await db.get(ProtegeSession, req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="session hasn't cleared the understanding threshold yet")

    body = "\n\n".join(
        f"{'Me' if turn['role'] == 'learner' else 'Confused peer'}: {turn['content']}"
        for turn in session.transcript_json
    )
    status = moderate_text(body)
    post = QnaPost(
        id=str(uuid.uuid4()),
        topic_id=session.topic_id,
        author_id=session.learner_id,
        body=body,
        moderation_status=status,
        source="protege_explanation",
    )
    db.add(post)
    session.status = "published"
    await db.commit()

    return {"id": post.id, "moderation_status": status}
