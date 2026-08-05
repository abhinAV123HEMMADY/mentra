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
  const [loadError, setLoadError] = useState(false);
  const [qnaBody, setQnaBody] = useState("");
  const [qnaStatus, setQnaStatus] = useState<string | null>(null);
  const [qnaError, setQnaError] = useState(false);

  useEffect(() => {
    setLoadError(false);
    Promise.all([getStruggleFeed(learnerId), getSquadProposals("derivatives")])
      .then(([feedRes, squadsRes]) => {
        setFeed(feedRes);
        setSquads(squadsRes);
      })
      .catch(() => setLoadError(true));
  }, [learnerId]);

  const submitQna = async () => {
    if (!qnaBody.trim()) return;
    setQnaError(false);
    try {
      const res = await postQna("derivatives", learnerId, qnaBody.trim());
      setQnaStatus(res.moderation_status);
      setQnaBody("");
    } catch {
      setQnaError(true);
    }
  };

  return (
    <div>
      <div className="page-title">
        <span className="eyebrow">Peer Insight</span>
        <h2>You're not the only one stuck</h2>
      </div>

      {loadError && (
        <div className="card animate-in" style={{ borderColor: "var(--struggling)" }}>
          <span className="tag struggling">Couldn't load the peer feed</span>
          <p style={{ margin: "8px 0 0" }}>Make sure the backend is running, then reload this page.</p>
        </div>
      )}

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
          {qnaError && (
            <p className="faint" style={{ marginBottom: 0, marginTop: 12 }}>
              Couldn't post — check the backend and try again.
            </p>
          )}
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
