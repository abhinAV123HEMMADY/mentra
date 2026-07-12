import { useEffect, useState } from "react";
import { bookTutor, getTutorAvailability } from "../api/rest";
import { useLearner } from "../LearnerContext";

export default function BookingModal({ tutorId, onClose }: { tutorId: string; onClose: () => void }) {
  const { learnerId } = useLearner();
  const [slots, setSlots] = useState<string[]>([]);
  const [holdResult, setHoldResult] = useState<{ status: string; booking_id: string | null } | null>(null);

  useEffect(() => {
    const weekStart = new Date().toISOString().slice(0, 10);
    getTutorAvailability(tutorId, weekStart).then(setSlots);
  }, [tutorId]);

  const book = async (slot: string) => {
    const result = await bookTutor(tutorId, learnerId, slot);
    setHoldResult(result);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div className="card" style={{ maxWidth: 480, width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <h3>Available slots this week</h3>
        {holdResult ? (
          <p>
            Hold status: <strong>{holdResult.status}</strong>
            {holdResult.booking_id && <span className="muted"> — booking {holdResult.booking_id} (15 min hold)</span>}
          </p>
        ) : (
          <div className="grid">
            {slots.length === 0 && <p className="muted">No open slots.</p>}
            {slots.map((slot) => (
              <button key={slot} className="secondary" onClick={() => book(slot)}>
                {new Date(slot).toLocaleString()}
              </button>
            ))}
          </div>
        )}
        <button style={{ marginTop: 12 }} className="secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
