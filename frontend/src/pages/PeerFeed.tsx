import { useEffect, useState } from "react";
import { getSquadProposals, getStruggleFeed, postQna } from "../api/rest";
import SquadCard from "../components/SquadCard";
import StruggleHeatmap from "../components/StruggleHeatmap";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { useLearner } from "../LearnerContext";
import type { SquadProposal, StruggleFeedItem } from "../types";

export default function PeerFeed() {
  const { learnerId } = useLearner();
  const [feed, setFeed] = useState<StruggleFeedItem[]>([]);
  const [squads, setSquads] = useState<SquadProposal[]>([]);
  const [qnaBody, setQnaBody] = useState("");
  const [qnaStatus, setQnaStatus] = useState<string | null>(null);

  useEffect(() => {
    getStruggleFeed(learnerId).then(setFeed);
    getSquadProposals("derivatives").then(setSquads);
  }, [learnerId]);

  const submitQna = async () => {
    if (!qnaBody.trim()) return;
    const res = await postQna("derivatives", learnerId, qnaBody.trim());
    setQnaStatus(res.moderation_status);
    setQnaBody("");
  };

  return (
    <div>
      <div className="page-title">
        <span className="eyebrow">Peer Insight</span>
        <h2>You're not the only one stuck</h2>
      </div>

      <section>
        <div className="row" style={{ justifyContent: "space-between", padding: "0 2px 8px" }}>
          <strong>Struggle feed</strong>
          <span className="faint">relative signal only</span>
        </div>
        <StruggleHeatmap items={feed} />
      </section>

      <section style={{ marginTop: 22 }}>
        <strong style={{ display: "block", padding: "0 2px 8px" }}>Study squads</strong>
        {squads.length === 0 ? (
          <div className="empty card" style={{ marginBottom: 0 }}>
            <span className="emoji">🧩</span>
            No squad yet for “derivatives” — needs 3+ connected learners struggling on the same node.
          </div>
        ) : (
          <div className="stagger">
            {squads.map((s) => (
              <SquadCard key={s.id} squad={s} />
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 22 }}>
        <strong style={{ display: "block", padding: "0 2px 8px" }}>Q&A · derivatives</strong>
        <div className="card">
          <div className="stack">
            <textarea
              rows={3}
              placeholder="Ask the group a question…"
              value={qnaBody}
              onChange={(e) => setQnaBody(e.target.value)}
              style={{ resize: "none" }}
            />
            <button onClick={submitQna} disabled={!qnaBody.trim()}>
              Post to feed <ArrowIcon size={16} />
            </button>
          </div>
          {qnaStatus && (
            <p className="faint" style={{ marginBottom: 0, marginTop: 12 }}>
              <CheckIcon size={13} className="muted" /> Moderation: {qnaStatus} — screened before
              peers see it.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
