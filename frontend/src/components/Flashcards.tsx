import { useState } from "react";
import { submitConfidence } from "../api/rest";
import { useLearner } from "../LearnerContext";
import type { Flashcard } from "../types";

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
    <div className="card">
      <strong>{card.front}</strong>
      {!revealed && (
        <div className="row" style={{ marginTop: 8 }}>
          <span className="muted">Confidence before reveal:</span>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button key={n} className="secondary" onClick={() => rate(n)}>
              {n}
            </button>
          ))}
        </div>
      )}
      {revealed && (
        <>
          <p className="muted" style={{ marginTop: 8 }}>
            {card.back}
          </p>
          {!submitted ? (
            <div className="row">
              <button onClick={() => answer(true)}>Got it</button>
              <button className="secondary" onClick={() => answer(false)}>
                Missed it
              </button>
            </div>
          ) : (
            <span className="tag on_track">FSRS updated — scheduled for review</span>
          )}
        </>
      )}
    </div>
  );
}

export default function Flashcards({ cards }: { cards: Flashcard[] }) {
  return (
    <div>
      <h3>Flashcards ({cards.length})</h3>
      <div className="grid">
        {cards.map((card, i) => (
          <Card key={card.id ?? i} card={card} />
        ))}
      </div>
    </div>
  );
}
