import { useRef, useState } from "react";
import { subscribeToSession } from "../api/ws";
import { startLearning } from "../api/rest";
import Flashcards from "../components/Flashcards";
import Lesson from "../components/Lesson";
import Quiz from "../components/Quiz";
import { useLearner } from "../LearnerContext";
import type { LearningSessionData, PipelineUpdate } from "../types";
import TopicInput from "./TopicInput";

const emptyData: LearningSessionData = { done: false };

export default function LearningPipeline() {
  const { learnerId } = useLearner();
  const [data, setData] = useState<LearningSessionData>(emptyData);
  const [running, setRunning] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleUpdate = ({ node, update }: PipelineUpdate) => {
    if (node === "_done") {
      setRunning(false);
      setData((prev) => ({ ...prev, done: true }));
      return;
    }
    setData((prev) => ({ ...prev, ...update, done: false }));
  };

  const onSubmit = async (topic: string, mode: "text" | "photo") => {
    cleanupRef.current?.();
    setData(emptyData);
    setRunning(true);

    const { session_id } = await startLearning(learnerId, topic, mode);
    cleanupRef.current = subscribeToSession(session_id, handleUpdate);
  };

  return (
    <div>
      <TopicInput onSubmit={onSubmit} disabled={running} />

      {data.prerequisite_gap && (
        <div className="card" style={{ borderColor: "var(--accent)" }}>
          <strong>Redirected to a prerequisite gap:</strong> mastery on{" "}
          <code>{data.prerequisite_gap}</code> is below threshold, so the lesson below targets
          that instead of the original topic (Section 4.2).
        </div>
      )}

      {data.lesson?.overview && <Lesson lesson={data.lesson} />}
      {data.quiz && data.quiz.length > 0 && <Quiz quiz={data.quiz} />}
      {data.flashcards && data.flashcards.length > 0 && <Flashcards cards={data.flashcards} />}

      {data.videos && data.videos.length > 0 && (
        <div className="card">
          <h3>Related video timestamps</h3>
          {data.videos.map((v) => (
            <div key={`${v.video_id}-${v.start_seconds}`} className="row">
              <a href={v.url} target="_blank" rel="noreferrer">
                {v.title} @ {v.start_seconds}s
              </a>
              <span className="muted">relevance {v.relevance.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {data.tutor_matches && data.tutor_matches.length > 0 && (
        <div className="card">
          <h3>Matched tutors</h3>
          {data.tutor_matches.map((t) => (
            <div key={t.id} className="row">
              <strong>{t.name}</strong>
              <span className="tag on_track">{t.verification_tier}</span>
              <span className="muted">${t.price_per_hour}/hr</span>
            </div>
          ))}
        </div>
      )}

      {typeof data.mastery_score === "number" && (
        <div className="card">
          <strong>Mastery score:</strong> {data.mastery_score.toFixed(2)}
        </div>
      )}

      {data.done && <p className="muted">Pipeline complete.</p>}
    </div>
  );
}
