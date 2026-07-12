from langgraph.graph import END, START, StateGraph

from app.orchestrator.nodes import (
    flashcard_fsrs_node,
    intent_parser_node,
    lesson_generator_node,
    mastery_scorer_node,
    prerequisite_graph_node,
    quiz_reexplain_node,
    snap_a_problem_node,
    stream_result_node,
    tutor_matcher_node,
    video_curator_node,
)
from app.orchestrator.state import LearningState


def route_by_input_mode(state: LearningState) -> str:
    return "photo" if state["input_mode"] == "photo" else "text"


def build_graph():
    graph = StateGraph(LearningState)

    graph.add_node("intent_parser", intent_parser_node)
    graph.add_node("snap_a_problem", snap_a_problem_node)
    graph.add_node("prerequisite_graph", prerequisite_graph_node)
    graph.add_node("lesson_generator", lesson_generator_node)
    graph.add_node("quiz_agent", quiz_reexplain_node)
    graph.add_node("flashcard_agent", flashcard_fsrs_node)
    graph.add_node("video_curator", video_curator_node)
    graph.add_node("tutor_matcher", tutor_matcher_node)
    graph.add_node("mastery_scorer", mastery_scorer_node)
    graph.add_node("stream_result", stream_result_node)

    graph.add_edge(START, "intent_parser")

    graph.add_conditional_edges(
        "intent_parser",
        route_by_input_mode,
        {"photo": "snap_a_problem", "text": "prerequisite_graph"},
    )

    graph.add_edge("snap_a_problem", "prerequisite_graph")
    graph.add_edge("prerequisite_graph", "lesson_generator")
    graph.add_edge("lesson_generator", "quiz_agent")
    graph.add_edge("quiz_agent", "flashcard_agent")

    # Fan out: video/tutor/mastery run in parallel once flashcards exist, then converge.
    graph.add_edge("flashcard_agent", "video_curator")
    graph.add_edge("flashcard_agent", "tutor_matcher")
    graph.add_edge("flashcard_agent", "mastery_scorer")

    graph.add_edge("video_curator", "stream_result")
    graph.add_edge("tutor_matcher", "stream_result")
    graph.add_edge("mastery_scorer", "stream_result")

    graph.add_edge("stream_result", END)

    return graph.compile()


learning_graph = build_graph()
