import { useRef, useState } from "react";
import { ArrowIcon, CameraIcon, SparkleIcon } from "../components/Icons";

export default function TopicInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (topic: string, mode: "text" | "photo") => void;
  disabled: boolean;
}) {
  const [topic, setTopic] = useState("derivatives");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onPhotoPicked = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onSubmit(reader.result, "photo");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="card animate-in">
      <span className="eyebrow">
        <SparkleIcon size={13} /> Start a session
      </span>
      <h2 style={{ marginTop: 8 }}>What are you learning?</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Type a topic — try <code>derivatives</code> to watch Mentra trace the gap back to{" "}
        <code>limits</code>. Or snap your worked attempt and Mentra finds the exact step where
        it broke.
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            onPhotoPicked(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          className="secondary"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
          title="Photograph your worked attempt — Mentra localizes the first wrong step"
        >
          <CameraIcon /> Snap your work
        </button>
        <button
          className="link-quiet"
          disabled={disabled}
          onClick={() => onSubmit("sample handwritten work", "photo")}
          style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", padding: 0 }}
        >
          …or try a sample photo (∫ x·cos x dx with a sign slip)
        </button>
      </div>
    </div>
  );
}
