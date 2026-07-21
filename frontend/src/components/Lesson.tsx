import type { LessonContent } from "../types";

export default function Lesson({ lesson }: { lesson: LessonContent }) {
  return (
    <div className="card animate-in">
      <span className="eyebrow">Lesson</span>
      <h3 style={{ marginTop: 6 }}>{lesson.topic_name}</h3>
      <p style={{ marginTop: 4 }}>{lesson.overview}</p>

      {lesson.worked_examples?.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {lesson.worked_examples.map((ex, i) => (
            <div key={i} className="example">
              <span className="pill-label">{ex.difficulty}</span>
              <strong style={{ display: "block", marginBottom: 4 }}>{ex.prompt}</strong>
              <p className="muted" style={{ margin: 0 }}>
                {ex.solution}
              </p>
            </div>
          ))}
        </div>
      )}

      {lesson.common_mistakes?.length > 0 && (
        <>
          <div className="divider" />
          <strong>Common mistakes</strong>
          <div className="stack" style={{ marginTop: 8 }}>
            {lesson.common_mistakes.map((m, i) => (
              <div key={i} className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "var(--struggling)", fontWeight: 800 }}>·</span>
                <span className="muted" style={{ flex: 1 }}>
                  {m}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
