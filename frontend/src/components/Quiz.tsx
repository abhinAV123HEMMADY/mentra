import { CheckIcon, CloseIcon, PlayIcon } from "./Icons";
import type { QuizQuestion, VideoResult } from "../types";

function ReexplanationList({ question }: { question: QuizQuestion }) {
  const entries = Object.entries(question.reexplanations ?? {});
  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <span className="faint">Re-explained: analogy → diagram → video</span>
      <div className="stack" style={{ marginTop: 8 }}>
        {entries.map(([modality, content]) => (
          <div key={modality} className="link-row" style={{ cursor: "default", gap: 10 }}>
            <span className="tag lav">{modality}</span>
            {modality === "video" ? (
              <a
                href={(content as VideoResult).url}
                target="_blank"
                rel="noreferrer"
                className="row"
                style={{ gap: 6, textDecoration: "none", color: "var(--text)" }}
              >
                <PlayIcon size={13} className="muted" />
                {(content as VideoResult).title} @ {(content as VideoResult).start_seconds}s
              </a>
            ) : (
              <span style={{ flex: 1 }}>{String(content)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Quiz({ quiz }: { quiz: QuizQuestion[] }) {
  return (
    <div className="card animate-in">
      <span className="eyebrow">Quiz</span>
      <h3 style={{ marginTop: 6, marginBottom: 10 }}>Check your understanding</h3>
      {quiz.map((q, i) => (
        <div key={i} className="example">
          <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
            <span
              className="tag"
              style={{
                background: q.correct ? "var(--ontrack-bg)" : "var(--struggling-bg)",
                color: q.correct ? "var(--ontrack)" : "var(--struggling)",
                marginTop: 2,
              }}
            >
              {q.correct ? <CheckIcon size={13} /> : <CloseIcon size={13} />}
            </span>
            <strong style={{ flex: 1 }}>{q.question}</strong>
          </div>
          {!q.correct && <ReexplanationList question={q} />}
        </div>
      ))}
    </div>
  );
}
