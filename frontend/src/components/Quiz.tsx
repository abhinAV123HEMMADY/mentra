import { useState } from "react";
import { submitQuizAnswer } from "../api/rest";
import { CheckIcon, CloseIcon, PlayIcon } from "./Icons";
import type { QuizQuestion } from "../types";

const MODALITY_ORDER = ["analogy", "diagram", "video"] as const;

function Reexplanation({ question }: { question: QuizQuestion }) {
  // Escalation ladder: start with the cheapest modality, reveal the next only on request.
  const [tiers, setTiers] = useState(1);
  const available = MODALITY_ORDER.filter((m) => question.reexplanations?.[m]);
  const shown = available.slice(0, tiers);
  const video = question.reexplanations?.video;

  if (available.length === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <span className="faint">Re-explained another way</span>
      <div className="stack" style={{ marginTop: 8 }}>
        {shown.map((modality) => (
          <div key={modality} className="link-row" style={{ cursor: "default", gap: 10 }}>
            <span className="tag lav">{modality}</span>
            {modality === "video" && video ? (
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="row"
                style={{ gap: 6, textDecoration: "none", color: "var(--text)" }}
              >
                <PlayIcon size={13} className="muted" />
                {video.title} @ {video.start_seconds}s
              </a>
            ) : (
              <span style={{ flex: 1, whiteSpace: "pre-wrap" }}>
                {String(question.reexplanations?.[modality] ?? "")}
              </span>
            )}
          </div>
        ))}
      </div>
      {tiers < available.length && (
        <button className="ghost" style={{ marginTop: 6 }} onClick={() => setTiers(tiers + 1)}>
          Still confused? Try the {available[tiers]} →
        </button>
      )}
    </div>
  );
}

function QuestionBlock({
  q,
  lessonId,
  onMastery,
}: {
  q: QuizQuestion;
  lessonId?: string;
  onMastery: (score: number) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [outcome, setOutcome] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const mark = async (correct: boolean) => {
    if (!lessonId || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      const res = await submitQuizAnswer(lessonId, q.question, correct);
      setOutcome(correct);
      if (res.mastery_score != null) onMastery(res.mastery_score);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="example">
      <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
        {outcome !== null && (
          <span
            className="tag"
            style={{
              background: outcome ? "var(--ontrack-bg)" : "var(--struggling-bg)",
              color: outcome ? "var(--ontrack)" : "var(--struggling)",
              marginTop: 2,
            }}
          >
            {outcome ? <CheckIcon size={13} /> : <CloseIcon size={13} />}
          </span>
        )}
        <strong style={{ flex: 1 }}>{q.question}</strong>
      </div>

      {!revealed ? (
        <button className="secondary" style={{ marginTop: 10 }} onClick={() => setRevealed(true)}>
          Show answer
        </button>
      ) : (
        <>
          <p className="muted" style={{ margin: "10px 0 0" }}>{q.answer}</p>
          {outcome === null && (
            <div className="stack" style={{ marginTop: 10 }}>
              <div className="row">
                <button disabled={!lessonId || saving} onClick={() => mark(true)}>
                  I got it
                </button>
                <button className="secondary" disabled={!lessonId || saving} onClick={() => mark(false)}>
                  I missed it
                </button>
              </div>
              {!lessonId && <span className="faint">Finishing up the session…</span>}
              {failed && <span className="faint">Couldn't save — check the backend and try again.</span>}
            </div>
          )}
          {outcome === false && <Reexplanation question={q} />}
        </>
      )}
    </div>
  );
}

export default function Quiz({
  quiz,
  lessonId,
  onMastery,
}: {
  quiz: QuizQuestion[];
  lessonId?: string;
  onMastery: (score: number) => void;
}) {
  return (
    <div className="card animate-in">
      <span className="eyebrow">Quiz</span>
      <h3 style={{ marginTop: 6, marginBottom: 10 }}>Check your understanding</h3>
      <p className="faint" style={{ marginTop: 0 }}>
        Answer it in your head (or on paper), reveal, then grade yourself honestly — this is
        what actually moves your mastery.
      </p>
      {quiz.map((q, i) => (
        <QuestionBlock key={i} q={q} lessonId={lessonId} onMastery={onMastery} />
      ))}
    </div>
  );
}
