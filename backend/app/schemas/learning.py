from pydantic import BaseModel


class LearnRequest(BaseModel):
    learner_id: str
    topic_input: str  # typed topic, or base64 photo payload when input_mode == "photo"
    input_mode: str = "text"  # "text" | "photo"


class LearnAccepted(BaseModel):
    session_id: str
    status: str = "queued"


class ConfidenceSubmission(BaseModel):
    card_id: str
    learner_id: str
    rating: int  # 0-5
    recalled: bool
