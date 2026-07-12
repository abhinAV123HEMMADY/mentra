from typing import TypedDict


class LearningState(TypedDict):
    topic_input: str            # typed topic OR OCR/vision output
    input_mode: str              # "text" | "photo"
    learner_id: str
    session_id: str
    parsed_objectives: dict
    prerequisite_gap: str | None  # traced upstream concept, if any
    lesson: dict
    quiz: list                   # [{question, answer, modality_attempts}]
    flashcards: list             # [{front, back, stability, difficulty, due_date}]
    confidence_ratings: dict     # card_id -> 0-5 self-rated confidence
    videos: list                 # [{url, start_seconds, relevance}]
    tutor_matches: list
    mastery_score: float
    struggle_signal: dict | None
