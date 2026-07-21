import type { SquadProposal } from "../types";

export default function SquadCard({ squad }: { squad: SquadProposal }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>Study squad · {squad.topic_id}</strong>
        <span className="tag lav">{squad.member_ids.length} members</span>
      </div>
      <p className="muted" style={{ margin: "6px 0 12px" }}>
        Shared flashcard deck seeded from the group's weakest cards.
      </p>
      <div className="row" style={{ gap: -8 }}>
        {squad.member_ids.map((id, i) => (
          <span
            key={id}
            className="avatar"
            style={{
              marginLeft: i === 0 ? 0 : -12,
              border: "2px solid var(--surface)",
              background: `linear-gradient(135deg, hsl(${(i * 60 + 240) % 360} 70% 66%), hsl(${
                (i * 60 + 300) % 360
              } 70% 66%))`,
              fontSize: 13,
              width: 34,
              height: 34,
            }}
            title={id}
          >
            {id.replace("u_", "").charAt(0).toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
