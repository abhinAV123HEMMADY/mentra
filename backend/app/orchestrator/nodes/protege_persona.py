"""Protégé Persona Agent — plays a naive student seeded with the topic's real common
misconceptions and asks exactly one genuinely confused follow-up question per turn
(Section 9.2).

Real implementation: a Claude call locked into a naive-student system prompt. Falls back to
a deterministic template stub when no ANTHROPIC_API_KEY is configured, cycling through the
topic's open misconceptions in order — matching every other agent node's demo-without-a-key
convention.
"""

from app.config import settings
from app.orchestrator.nodes.understanding_scorer import _is_stuck
from app.orchestrator.protege_state import ProtegeState

_WRAP_UP = "Ohh, okay — I think I actually get it now. Thanks for walking me through it!"


def _stub_question(
    misconceptions: list[dict], checklist: dict[str, bool], stuck: bool, gave_up_on: str | None
) -> str:
    open_misconceptions = [m for m in misconceptions if not checklist.get(m["id"])]

    if gave_up_on:
        explained = next((m for m in misconceptions if m["id"] == gave_up_on), None)
        lead = f"That's alright, let's move on — {explained['explanation']}" if explained else "That's alright, let's move on."
        if not open_misconceptions:
            return f"{lead} {_WRAP_UP}"
        return f"{lead} Okay, here's something else I'm stuck on: {open_misconceptions[0]['misconception_prompt']}"

    if not open_misconceptions:
        return _WRAP_UP

    if stuck:
        return f"No worries — here's a nudge: {open_misconceptions[0]['hint']} Want to take another shot at it?"

    return open_misconceptions[0]["misconception_prompt"]


async def _claude_question(
    topic_name: str,
    misconceptions: list[dict],
    checklist: dict[str, bool],
    transcript: list[dict],
    stuck: bool,
    gave_up_on: str | None,
) -> str:
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    open_misconceptions = [m for m in misconceptions if not checklist.get(m["id"])]

    system = (
        f"You are a naive student being taught {topic_name} by a peer tutor. You genuinely "
        "hold misconceptions until they are directly addressed. Rules: ask exactly ONE short, "
        "genuinely confused follow-up question per turn. Never say you understand unless the "
        "tutor's last explanation directly resolved a specific misconception — if it was vague "
        "or didn't address one, restate your confusion in your own words instead of agreeing. "
        "Stay in character as a confused peer, not an assistant."
    )

    if gave_up_on:
        explained = next((m for m in misconceptions if m["id"] == gave_up_on), None)
        explanation = explained["explanation"] if explained else "the underlying idea"
        system += (
            f"\n\nThe tutor has said they don't know twice in a row on this point, so the "
            f"conversation is stuck. Don't ask again — briefly explain in your own words that "
            f"you thought about it and it clicked: {explanation}. Then, in the same reply, move "
            "on to your next open confusion (or, if nothing is left open, say you think you get "
            "it now and thank them)."
        )
        if not open_misconceptions:
            system += "\n\nNothing is left open — just deliver the explanation and the thank-you, no question."
        else:
            system += "\n\nYour remaining open misconceptions:\n" + "\n".join(
                f'- {m["sub_concept"]}: "{m["misconception_prompt"]}"' for m in open_misconceptions
            )
    elif not open_misconceptions:
        return _WRAP_UP
    else:
        system += "\n\nYour open misconceptions:\n" + "\n".join(
            f'- {m["sub_concept"]}: "{m["misconception_prompt"]}"' for m in open_misconceptions
        )
        if stuck:
            system += (
                "\n\nThe tutor just said they don't know / aren't sure. Don't just repeat your "
                "last question verbatim — be encouraging, offer one small concrete hint that "
                "nudges them toward the idea without giving away the full answer, then invite "
                "them to try again in different words."
            )

    convo = "\n".join(f"{t['role']}: {t['content']}" for t in transcript)
    message = await client.messages.create(
        model="claude-sonnet-5",
        max_tokens=180,
        system=system,
        messages=[
            {"role": "user", "content": f"Conversation so far:\n{convo}\n\nRespond as the confused student."}
        ],
    )
    return "".join(block.text for block in message.content if block.type == "text").strip()


async def protege_persona_node(state: ProtegeState) -> dict:
    misconceptions = state["misconceptions"]
    checklist = state["checklist"]
    transcript = list(state["transcript"])
    gave_up_on = state.get("gave_up_on")

    last_turn = transcript[-1] if transcript else None
    stuck = bool(last_turn and last_turn["role"] == "learner" and _is_stuck(last_turn["content"]))

    if settings.anthropic_api_key:
        persona_message = await _claude_question(
            state["topic_name"], misconceptions, checklist, transcript, stuck, gave_up_on
        )
    else:
        persona_message = _stub_question(misconceptions, checklist, stuck, gave_up_on)

    transcript.append({"role": "persona", "content": persona_message})

    return {"persona_message": persona_message, "transcript": transcript}
