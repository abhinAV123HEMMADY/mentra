import { useState } from "react";
import { ArrowIcon, CameraIcon, SparkleIcon } from "../components/Icons";

export default function TopicInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (topic: string, mode: "text" | "photo") => void;
  disabled: boolean;
}) {
  const [topic, setTopic] = useState("derivatives");

  return (
    <div className="card animate-in">
      <span className="eyebrow">
        <SparkleIcon size={13} /> Start a session
      </span>
      <h2 style={{ marginTop: 8 }}>What are you learning?</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Type a topic — try <code>derivatives</code> to watch Mentra trace the gap back to{" "}
        <code>limits</code>.
      </p>

      <div className="stack" style={{ marginTop: 4 }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. derivatives, photosynthesis, the French Revolution…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && topic.trim() && !disabled) onSubmit(topic.trim(), "text");
          }}
        />
        <button
          disabled={disabled || !topic.trim()}
          onClick={() => onSubmit(topic.trim(), "text")}
        >
          {disabled ? "Generating…" : "Generate lesson"}
          {!disabled && <ArrowIcon size={17} />}
        </button>
        <button
          className="secondary"
          disabled={disabled}
          onClick={() => onSubmit("integration by parts", "photo")}
          title="Simulates a photographed problem (Snap-a-Problem)"
        >
          <CameraIcon /> Snap a problem
        </button>
      </div>
    </div>
  );
}
