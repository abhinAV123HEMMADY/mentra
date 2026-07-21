import { useState } from "react";
import { submitConfidence } from "../api/rest";
import { CheckIcon } from "./Icons";
import { useLearner } from "../LearnerContext";
import type { Flashcard } from "../types";

const CONF_LABELS = ["No idea", "Shaky", "Unsure", "Maybe", "Likely", "Certain"];

function Card({ card }: { card: Flashcard }) {
  const { learnerId } = useLearner();
  const [confidence, setConfidence] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const rate = (rating: number) => {
    setConfidence(rating);
    setRevealed(true);
  };

  const answer = async (recalled: boolean) => {
    if (confidence === null || !card.id) return;
    await submitConfidence(card.id, learnerId, confidence, recalled);
    setSubmitted(true);
  };

  return (
    <div className={`flip ${revealed ? "flipped" : ""}`}>
      <div className="flip-inner" style={{ minHeight: 168 }}>
        {/* Front — question + confidence */}
        <div className="flip-face card" style={{ margin: 0, height: "100%" }}>
          <span className="faint">Rate your confidence first</span>
          <strong style={{ display: "block", margin: "8px 0 14px", fontSize: 16 }}>
            {card.front}
          </strong>
          <div className="row" style={{ gap: 6 }}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className="secondary chip"
                style={{ minWidth: 38 }}
                onClick={() => rate(n)}
                title={CONF_LABELS[n]}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Back — answer + recall */}
        <div className="flip-face flip-back card" style={{ margin: 0, height: "100%" }}>
          {confidence !== null && (
            <span className="tag lav">confidence {confidence} · {CONF_LABELS[confidence]}</span>
          )}
          <p style={{ margin: "10px 0 14px" }}>{card.back}</p>
          {!submitted ? (
            <div className="row">
              <button onClick={() => answer(true)}>Got it</button>
              <button className="secondary" onClick={() => answer(false)}>
                Missed it
              </button>
            </div>
          ) : (
            <span className="tag on_track">
              <CheckIcon size={13} /> FSRS scheduled
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Flashcards({ cards }: { cards: Flashcard[] }) {
  return (
    <div className="animate-in" style={{ marginBottom: 14 }}>
      <div className="row" style={{ justifyContent: "space-between", padding: "0 2px 10px" }}>
        <h3 style={{ margin: 0 }}>Flashcards</h3>
        <span className="tag neutral">{cards.length} cards</span>
      </div>
      <div className="grid stagger">
        {cards.map((card, i) => (
          <Card key={card.id ?? i} card={card} />
        ))}
      </div>
    </div>
  );
}
