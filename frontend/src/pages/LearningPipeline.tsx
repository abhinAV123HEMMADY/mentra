import { useRef, useState } from "react";
import { subscribeToSession } from "../api/ws";
import { startLearning } from "../api/rest";
import Flashcards from "../components/Flashcards";
import Lesson from "../components/Lesson";
import Quiz from "../components/Quiz";
import { ArrowIcon, PlayIcon, StarIcon } from "../components/Icons";
import { useLearner } from "../LearnerContext";
import type { LearningSessionData, PipelineUpdate } from "../types";
import TopicInput from "./TopicInput";

const emptyData: LearningSessionData = { done: false };

const STEP_LABELS = ["Lesson", "Quiz", "Cards", "Sources"];

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

  const stepDone = [
    !!data.lesson?.overview,
    !!(data.quiz && data.quiz.length),
    !!(data.flashcards && data.flashcards.length),
    !!(data.videos && data.videos.length) || !!(data.tutor_matches && data.tutor_matches.length),
  ];
  const activeStep = stepDone.findIndex((d) => !d);

  return (
    <div>
      <TopicInput onSubmit={onSubmit} disabled={running} />

      {running && (
        <div className="card animate-in">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Building your learning package…</strong>
            <span className="faint">streaming live</span>
          </div>
          <div className="steps">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`step ${stepDone[i] ? "done" : i === activeStep ? "active" : ""}`}
              />
            ))}
          </div>
          <div className="row" style={{ marginTop: 8, gap: 14 }}>
            {STEP_LABELS.map((label, i) => (
              <span key={label} className="faint" style={{ opacity: stepDone[i] ? 1 : 0.5 }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.prerequisite_gap && (
        <div
          className="card animate-in"
          style={{ borderColor: "var(--primary)", background: "var(--chip-lav)" }}
        >
          <span className="eyebrow">Prerequisite gap traced</span>
          <p style={{ margin: "6px 0 0" }}>
            Your mastery on <code>{data.prerequisite_gap}</code> is below threshold, so this lesson
            targets the real upstream gap instead of the topic you asked for.
          </p>
        </div>
      )}

      {data.lesson?.overview && <Lesson lesson={data.lesson} />}
      {data.quiz && data.quiz.length > 0 && <Quiz quiz={data.quiz} />}
      {data.flashcards && data.flashcards.length > 0 && <Flashcards cards={data.flashcards} />}

      {data.videos && data.videos.length > 0 && (
        <div className="card animate-in">
          <h3>Jump to the exact moment</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Timestamp-level matches, not whole videos.
          </p>
          <div className="stack">
            {data.videos.map((v) => (
              <a
                key={`${v.video_id}-${v.start_seconds}`}
                className="link-row"
                href={v.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="play-badge">
                  <PlayIcon />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block" }}>{v.title}</strong>
                  <span className="faint">
                    @ {Math.floor(v.start_seconds / 60)}:
                    {String(v.start_seconds % 60).padStart(2, "0")} · relevance{" "}
                    {v.relevance.toFixed(2)}
                  </span>
                </span>
                <ArrowIcon size={16} className="muted" />
              </a>
            ))}
          </div>
        </div>
      )}

      {data.tutor_matches && data.tutor_matches.length > 0 && (
        <div className="card animate-in">
          <h3>Human help on this topic</h3>
          <div className="stack">
            {data.tutor_matches.map((t) => (
              <div key={t.id} className="link-row" style={{ cursor: "default" }}>
                <span
                  className="avatar"
                  style={{ background: "linear-gradient(135deg, var(--primary), hsl(28 85% 66%))" }}
                >
                  {t.name.charAt(0)}
                </span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: "block" }}>{t.name}</strong>
                  <span className="faint">
                    <StarIcon size={12} /> {t.rating.toFixed(1)} · ${t.price_per_hour}/hr
                  </span>
                </span>
                <span className="tag on_track">{t.verification_tier.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {typeof data.mastery_score === "number" && (
        <div className="card animate-in">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Mastery</h3>
            <strong style={{ fontSize: 20 }}>{Math.round(data.mastery_score * 100)}%</strong>
          </div>
          <div className="meter" style={{ marginTop: 12 }}>
            <span style={{ width: `${Math.min(100, Math.max(4, data.mastery_score * 100))}%` }} />
          </div>
          <p className="faint" style={{ marginTop: 10, marginBottom: 0 }}>
            Blended from quiz accuracy, flashcard recall, and your confidence ratings.
          </p>
        </div>
      )}

      {data.done && (
        <p className="muted" style={{ textAlign: "center", padding: "8px 0 4px" }}>
          ✓ Session complete
        </p>
      )}
    </div>
  );
}
