"""Shared Claude helper for agent nodes.

Every LLM-backed node follows the same convention: call Claude when ANTHROPIC_API_KEY is
configured, and fall back to its deterministic stub when it isn't — or when the live call
fails for any reason. Centralizing the forced-tool-use call keeps that failure handling in
one place: a node never crashes the pipeline because of a network error or a bad key; it
just degrades to its stub.
"""

import logging

from app.config import settings

MODEL = "claude-sonnet-5"

log = logging.getLogger(__name__)


def claude_enabled() -> bool:
    return bool(settings.anthropic_api_key)


async def forced_tool_call(
    system: str, content, tool: dict, max_tokens: int = 2000
) -> dict | None:
    """Run a single forced-tool-use Claude call and return the tool's input payload.

    `content` is a user-message content value — a plain string or a content-block list
    (e.g. image + text for vision). Returns None on any failure so the caller can fall
    back to its deterministic stub.
    """
    if not claude_enabled():
        return None
    try:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        message = await client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system,
            tools=[tool],
            tool_choice={"type": "tool", "name": tool["name"]},
            messages=[{"role": "user", "content": content}],
        )
        for block in message.content:
            if block.type == "tool_use":
                return block.input
    except Exception:
        log.exception("Claude call failed; node falls back to its stub")
    return None
