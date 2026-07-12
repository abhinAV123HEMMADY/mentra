import type { SquadProposal } from "../types";

export default function SquadCard({ squad }: { squad: SquadProposal }) {
  return (
    <div className="card">
      <strong>Study squad: {squad.topic_id}</strong>
      <p className="muted">{squad.member_ids.length} members, shared flashcard deck seeded from weakest cards</p>
      <div className="row">
        {squad.member_ids.map((id) => (
          <span key={id} className="tag on_track">
            {id}
          </span>
        ))}
      </div>
    </div>
  );
}
