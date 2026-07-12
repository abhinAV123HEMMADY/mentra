import type { LessonContent } from "../types";

export default function Lesson({ lesson }: { lesson: LessonContent }) {
  return (
    <div className="card">
      <h3>{lesson.topic_name}</h3>
      <p>{lesson.overview}</p>
      {lesson.worked_examples?.map((ex, i) => (
        <div key={i} style={{ marginTop: 8 }}>
          <strong>
            Example ({ex.difficulty}): {ex.prompt}
          </strong>
          <p className="muted">{ex.solution}</p>
        </div>
      ))}
      {lesson.common_mistakes?.length > 0 && (
        <>
          <strong>Common mistakes</strong>
          <ul>
            {lesson.common_mistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
