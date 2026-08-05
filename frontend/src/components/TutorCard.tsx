import { CheckIcon, StarIcon } from "./Icons";
import type { TutorResult } from "../types";

const TIER_LABEL: Record<string, string> = {
  background_checked: "Background checked",
  basic: "Basic",
  unverified: "Unverified",
};

export default function TutorCard({ tutor, onBook }: { tutor: TutorResult; onBook: () => void }) {
  const verified = tutor.verification_tier === "background_checked";

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "flex-start" }}>
        <span className="avatar" style={{ width: 52, height: 52, fontSize: 19 }}>
          {tutor.name.charAt(0)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <h3 style={{ margin: 0 }}>{tutor.name}</h3>
            <strong style={{ fontSize: 14.5, color: "var(--primary-bright)" }}>
              ${tutor.price_per_hour}/hr
            </strong>
          </div>
          <span className="faint" style={{ marginTop: 3 }}>
            <StarIcon size={13} className="" /> {tutor.rating.toFixed(1)} ·{" "}
            {tutor.session_format.replace("_", " ")}
          </span>
          <div className="chip-row" style={{ marginTop: 9, gap: 6 }}>
            {tutor.subjects.map((s) => (
              <span key={s} className="tag lav">
                {s}
              </span>
            ))}
            <span className={`tag ${verified ? "on_track" : "outline"}`}>
              {verified && <CheckIcon size={12} />}
              {TIER_LABEL[tutor.verification_tier] ?? tutor.verification_tier}
            </span>
          </div>
        </div>
      </div>

      <div className="divider" style={{ margin: "16px 0 12px" }} />

      <span className="eyebrow">Availability</span>
      <button className="block" style={{ marginTop: 10 }} onClick={onBook}>
        View open slots
      </button>
    </div>
  );
}
