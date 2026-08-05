import { useEffect, useState } from "react";
import { bookTutor, getTutorAvailability } from "../api/rest";
import { CheckIcon, CloseIcon } from "./Icons";
import { useLearner } from "../LearnerContext";

export default function BookingModal({ tutorId, onClose }: { tutorId: string; onClose: () => void }) {
  const { learnerId } = useLearner();
  const [slots, setSlots] = useState<string[]>([]);
  const [holdResult, setHoldResult] = useState<{ status: string; booking_id: string | null } | null>(
    null,
  );

  useEffect(() => {
    const weekStart = new Date().toISOString().slice(0, 10);
    getTutorAvailability(tutorId, weekStart).then(setSlots);
  }, [tutorId]);

  const book = async (slot: string) => {
    const result = await bookTutor(tutorId, learnerId, slot);
    setHoldResult(result);
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>Available this week</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {holdResult ? (
          <div className="empty" style={{ padding: "28px 12px" }}>
            <span className="emoji">✅</span>
            <p style={{ margin: 0 }}>
              Hold <strong>{holdResult.status}</strong>
            </p>
            {holdResult.booking_id && (
              <p className="faint" style={{ marginTop: 6 }}>
                Booking {holdResult.booking_id} · expires in 15 min if unconfirmed
              </p>
            )}
          </div>
        ) : slots.length === 0 ? (
          <p className="muted" style={{ padding: "8px 0" }}>
            No open slots this week.
          </p>
        ) : (
          <div className="chip-row" style={{ marginTop: 12 }}>
            {slots.map((slot) => (
              <button key={slot} className="chip slot" onClick={() => book(slot)}>
                {new Date(slot).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
