import type { StruggleFeedItem } from "../types";

const GRADIENTS = [
  "linear-gradient(135deg, var(--accent), var(--accent-bright))",
  "linear-gradient(135deg, var(--sage), hsl(152 45% 45%))",
  "linear-gradient(135deg, var(--amber), var(--accent-2))",
  "linear-gradient(135deg, var(--accent-2), var(--accent))",
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
