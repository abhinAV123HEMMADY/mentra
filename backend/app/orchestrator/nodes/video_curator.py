from app.mcp_clients import search_transcripts
from app.orchestrator.state import LearningState


async def video_curator_node(state: LearningState) -> dict:
    """Real MCP call to the Video Transcript server — returns exact timestamps, not whole videos."""
    topic_name = state["parsed_objectives"]["topic_name"]
    results = await search_transcripts(topic_query=topic_name, difficulty_level="intro", max_results=5)

    videos = [
        {
            "video_id": r["video_id"],
            "title": r["video_title"],
            "start_seconds": r["chunk_start_seconds"],
            "url": f"https://youtube.com/watch?v={r['video_id']}&t={r['chunk_start_seconds']}s",
            "relevance": r["relevance"],
        }
        for r in results
    ]

    # Attach the top video timestamp to any quiz question still waiting on the "video" modality
    # (Section 4.5's third-tier re-explanation fallback).
    quiz = list(state.get("quiz", []))
    if videos:
        for question in quiz:
            if question.get("needs_video"):
                question["reexplanations"]["video"] = videos[0]

    return {"videos": videos, "quiz": quiz}
