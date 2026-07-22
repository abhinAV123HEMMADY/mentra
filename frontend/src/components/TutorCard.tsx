import { StarIcon } from "./Icons";
import type { TutorResult } from "../types";

const TIER_LABEL: Record<string, string> = {
  background_checked: "background checked",
  basic: "basic",
  unverified: "unverified",
};

export default function TutorCard({ tutor, onBook }: { tutor: TutorResult; onBook: () => void }) {
  const verified = tutor.verification_tier === "background_checked";
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="row" style={{ gap: 12 }}>
        <span
          className="avatar"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}
        >
          {tutor.name.charAt(0)}
        </span>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{tutor.name}</strong>
            <span className={`tag ${verified ? "on_track" : "neutral"}`}>
              {TIER_LABEL[tutor.verification_tier] ?? tutor.verification_tier}
            </span>
          </div>
          <span className="faint">{tutor.subjects.join(" · ")}</span>
        </div>
      </div>

      <div className="row" style={{ marginTop: 14, gap: 16 }}>
        <span className="row" style={{ gap: 5 }}>
          <StarIcon size={14} className="" />
          <strong>{tutor.rating.toFixed(1)}</strong>
        </span>
        <span className="muted">${tutor.price_per_hour}/hr</span>
        <span className="tag neutral">{tutor.session_format.replace("_", " ")}</span>
      </div>

      <button style={{ marginTop: 14, width: "100%" }} onClick={onBook}>
        View availability
      </button>
    </div>
  );
}
