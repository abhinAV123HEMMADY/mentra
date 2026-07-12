import { useState } from "react";

export default function TopicInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (topic: string, mode: "text" | "photo") => void;
  disabled: boolean;
}) {
  const [topic, setTopic] = useState("derivatives");

  return (
    <div className="card">
      <h2>What are you learning?</h2>
      <p className="muted">
        Type a topic, or try "derivatives" to see the prerequisite-gap redirect (the seeded
        learner is weak on "limits").
      </p>
      <div className="row">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. derivatives"
          style={{ flex: 1, minWidth: 220 }}
        />
        <button disabled={disabled || !topic.trim()} onClick={() => onSubmit(topic.trim(), "text")}>
          {disabled ? "Generating..." : "Generate lesson"}
        </button>
        <button
          className="secondary"
          disabled={disabled}
          onClick={() => onSubmit("integration by parts", "photo")}
          title="Simulates a photographed problem (Snap-a-Problem stub)"
        >
          Snap a problem (demo)
        </button>
      </div>
    </div>
  );
}
