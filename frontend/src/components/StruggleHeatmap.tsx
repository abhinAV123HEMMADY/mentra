import type { StruggleFeedItem } from "../types";

export default function StruggleHeatmap({ items }: { items: StruggleFeedItem[] }) {
  if (items.length === 0) {
    return <p className="muted">No connections have shared a struggle signal yet.</p>;
  }

  return (
    <div className="grid">
      {items.map((item, i) => (
        <div key={i} className="card">
          <div className="row">
            <strong>{item.user_id}</strong>
            <span className={`tag ${item.relative_signal}`}>{item.relative_signal.replace("_", " ")}</span>
          </div>
          <span className="muted">{item.topic_name}</span>
        </div>
      ))}
    </div>
  );
}
