from app.orchestrator.state import LearningState


async def snap_a_problem_node(state: LearningState) -> dict:
    """Runs OCR + a vision-capable Claude call to identify the underlying concept in a photographed problem.

    STUB: real implementation would OCR `state["topic_input"]` (a base64 image payload) with
    Tesseract, then ask Claude vision to name the tested concept rather than transcribe the digits.
    Here we just pass through a canned concept so the graph can be exercised without an image pipeline.
    """
    return {
        "topic_input": "integration by parts",
    }
