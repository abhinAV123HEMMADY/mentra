import { useEffect, useState } from "react";
import { getSquadProposals, getStruggleFeed, postQna } from "../api/rest";
import SquadCard from "../components/SquadCard";
import StruggleHeatmap from "../components/StruggleHeatmap";
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
      <h2>Struggle feed</h2>
      <p className="muted">Signals from your connections — relative only, never a raw score (Section 7.2).</p>
      <StruggleHeatmap items={feed} />

      <h2 style={{ marginTop: 24 }}>Study squads</h2>
      {squads.length === 0 ? (
        <p className="muted">No squad proposed yet for "derivatives" — needs 3+ connected learners struggling.</p>
      ) : (
        squads.map((s) => <SquadCard key={s.id} squad={s} />)
      )}

      <h2 style={{ marginTop: 24 }}>Q&A: derivatives</h2>
      <div className="card">
        <div className="row">
          <input
            style={{ flex: 1 }}
            placeholder="Ask a question..."
            value={qnaBody}
            onChange={(e) => setQnaBody(e.target.value)}
          />
          <button onClick={submitQna}>Post</button>
        </div>
        {qnaStatus && <p className="muted">Moderation status: {qnaStatus}</p>}
      </div>
    </div>
  );
}
