import type { TutorResult } from "../types";

export default function TutorCard({ tutor, onBook }: { tutor: TutorResult; onBook: () => void }) {
  return (
    <div className="card">
      <div className="row">
        <strong>{tutor.name}</strong>
        <span className="tag on_track">{tutor.verification_tier}</span>
      </div>
      <p className="muted">{tutor.subjects.join(", ")}</p>
      <div className="row">
        <span>★ {tutor.rating.toFixed(1)}</span>
        <span className="muted">${tutor.price_per_hour}/hr</span>
        <span className="muted">{tutor.session_format}</span>
      </div>
      <button style={{ marginTop: 8 }} onClick={onBook}>
        View availability
      </button>
    </div>
  );
}
