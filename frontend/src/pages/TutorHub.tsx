import { useState } from "react";
import { searchTutors } from "../api/rest";
import BookingModal from "../components/BookingModal";
import TutorCard from "../components/TutorCard";
import { ArrowIcon } from "../components/Icons";
import type { TutorResult } from "../types";

export default function TutorHub() {
  const [topicQuery, setTopicQuery] = useState("derivatives");
  const [priceMax, setPriceMax] = useState<string>("");
  const [format, setFormat] = useState<string>("");
  const [verificationTier, setVerificationTier] = useState<string>("");
  const [results, setResults] = useState<TutorResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [bookingTutorId, setBookingTutorId] = useState<string | null>(null);

  const search = async () => {
    const tutors = await searchTutors({
      subject: "math",
      topic_query: topicQuery,
      price_max: priceMax ? Number(priceMax) : undefined,
      session_format: format || undefined,
      verification_tier: verificationTier || undefined,
    });
    setResults(tutors);
    setSearched(true);
  };

  return (
    <div>
      <div className="page-title">
        <span className="eyebrow">Tutor Hub</span>
        <h2>Find human help</h2>
      </div>

      <div className="card">
        <div className="stack">
          <input
            value={topicQuery}
            onChange={(e) => setTopicQuery(e.target.value)}
            placeholder="Topic"
          />
          <div className="row" style={{ gap: 8 }}>
            <input
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Max $/hr"
              inputMode="numeric"
              style={{ flex: 1, minWidth: 0 }}
            />
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            >
              <option value="">Any format</option>
              <option value="virtual">Virtual</option>
              <option value="in_person">In person</option>
            </select>
          </div>
          <select value={verificationTier} onChange={(e) => setVerificationTier(e.target.value)}>
            <option value="">Any verification tier</option>
            <option value="unverified">Unverified</option>
            <option value="basic">Basic</option>
            <option value="background_checked">Background checked</option>
          </select>
          <button onClick={search}>
            Search tutors <ArrowIcon size={16} />
          </button>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="grid stagger">
          {results.map((t) => (
            <TutorCard key={t.id} tutor={t} onBook={() => setBookingTutorId(t.id)} />
          ))}
        </div>
      ) : (
        searched && (
          <div className="empty card">
            <span className="emoji">🔍</span>
            No tutors match those filters — try loosening the price or tier.
          </div>
        )
      )}

      {bookingTutorId && (
        <BookingModal tutorId={bookingTutorId} onClose={() => setBookingTutorId(null)} />
      )}
    </div>
  );
}
