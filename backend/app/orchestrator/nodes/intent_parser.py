import re

from sqlalchemy import select

from app.database import async_session
from app.models import Topic
from app.orchestrator.state import LearningState


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


async def intent_parser_node(state: LearningState) -> dict:
    """Normalizes topic_input (or the Snap-a-Problem Agent's output) into a concept + objectives.

    STUB: a real implementation calls Claude to extract objectives from free text.
    Here we resolve against the seeded topics table by name match, falling back to
    a slug-derived ad-hoc topic so the rest of the graph always has a topic_id to work with.
    """
    raw_topic = state["topic_input"].strip()

    async with async_session() as db:
        result = await db.execute(select(Topic).where(Topic.name.ilike(f"%{raw_topic}%")))
        topic = result.scalars().first()

    if topic:
        topic_id, topic_name, subject = topic.id, topic.name, topic.subject
    else:
        topic_id, topic_name, subject = _slugify(raw_topic), raw_topic, "general"

    objectives = [
        f"Understand the core definition of {topic_name}",
        f"Work through a worked example involving {topic_name}",
        f"Identify common mistakes learners make with {topic_name}",
    ]

    return {
        "parsed_objectives": {
            "topic_id": topic_id,
            "topic_name": topic_name,
            "subject": subject,
            "objectives": objectives,
        }
    }
