import type { StruggleFeedItem } from "../types";

const GRADIENTS = [
  "linear-gradient(135deg, hsl(258 80% 70%), hsl(208 80% 68%))",
  "linear-gradient(135deg, hsl(152 60% 60%), hsl(180 60% 60%))",
  "linear-gradient(135deg, hsl(28 85% 68%), hsl(349 78% 70%))",
  "linear-gradient(135deg, hsl(208 80% 68%), hsl(258 80% 72%))",
];

export default function StruggleHeatmap({ items }: { items: StruggleFeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="empty card" style={{ marginBottom: 0 }}>
        <span className="emoji">🌱</span>
        No connections have shared a struggle signal yet.
      </div>
    );
  }

  return (
    <div className="grid stagger">
      {items.map((item, i) => (
        <div key={i} className="card" style={{ marginBottom: 0 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: 10 }}>
              <span className="avatar" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                {item.user_id.replace("u_", "").charAt(0).toUpperCase()}
              </span>
              <div>
                <strong style={{ display: "block" }}>{item.user_id.replace("u_", "@")}</strong>
                <span className="faint">{item.topic_name}</span>
              </div>
            </div>
            <span className={`tag ${item.relative_signal}`}>
              {item.relative_signal.replace("_", " ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
