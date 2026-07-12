import type { QuizQuestion, VideoResult } from "../types";

function ReexplanationList({ question }: { question: QuizQuestion }) {
  const entries = Object.entries(question.reexplanations ?? {});
  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <span className="muted">Re-explanation order: analogy → diagram → video</span>
      {entries.map(([modality, content]) => (
        <div key={modality} className="row" style={{ marginTop: 4 }}>
          <span className="tag on_track">{modality}</span>
          {modality === "video" ? (
            <a href={(content as VideoResult).url} target="_blank" rel="noreferrer">
              {(content as VideoResult).title} @ {(content as VideoResult).start_seconds}s
            </a>
          ) : (
            <span>{String(content)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Quiz({ quiz }: { quiz: QuizQuestion[] }) {
  return (
    <div className="card">
      <h3>Quiz</h3>
      {quiz.map((q, i) => (
        <div key={i} style={{ marginTop: i > 0 ? 16 : 0, borderTop: i > 0 ? "1px solid var(--border)" : "none", paddingTop: i > 0 ? 12 : 0 }}>
          <div className="row">
            <strong>{q.question}</strong>
            <span className={`tag ${q.correct ? "on_track" : "struggling"}`}>{q.correct ? "correct" : "missed"}</span>
          </div>
          {!q.correct && <ReexplanationList question={q} />}
        </div>
      ))}
    </div>
  );
}
