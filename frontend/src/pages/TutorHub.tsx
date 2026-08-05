import { useState } from "react";
import { searchTutors } from "../api/rest";
import BookingModal from "../components/BookingModal";
import TutorCard from "../components/TutorCard";
import { SearchIcon } from "../components/Icons";
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
      <div className="search">
        <SearchIcon />
        <input
          value={topicQuery}
          onChange={(e) => setTopicQuery(e.target.value)}
          placeholder="Find a guide…"
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
        />
        <button className="icon-btn" onClick={search} aria-label="Search tutors">
          <SearchIcon size={17} />
        </button>
      </div>

      <div className="chip-row" style={{ marginTop: 12 }}>
        <select
          className="filter-select"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          aria-label="Session format"
        >
          <option value="">Any format</option>
          <option value="virtual">Virtual</option>
          <option value="in_person">In person</option>
        </select>
        <select
          className="filter-select"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          aria-label="Max price per hour"
        >
          <option value="">Any price</option>
          <option value="40">Under $40/hr</option>
          <option value="60">Under $60/hr</option>
          <option value="90">Under $90/hr</option>
        </select>
        <select
          className="filter-select"
          value={verificationTier}
          onChange={(e) => setVerificationTier(e.target.value)}
          aria-label="Verification tier"
        >
          <option value="">Any tier</option>
          <option value="unverified">Unverified</option>
          <option value="basic">Basic</option>
          <option value="background_checked">Background checked</option>
        </select>
      </div>

      <button className="block" style={{ marginTop: 16 }} onClick={search}>
        Search guides
      </button>

      {results.length > 0 ? (
        <div className="stack stagger" style={{ marginTop: 22 }}>
          {results.map((t) => (
            <TutorCard key={t.id} tutor={t} onBook={() => setBookingTutorId(t.id)} />
          ))}
        </div>
      ) : (
        searched && (
          <div className="card empty" style={{ marginTop: 22 }}>
            <span className="emoji">🔍</span>
            No guides match those filters — try loosening the price or tier.
          </div>
        )
      )}

      {bookingTutorId && (
        <BookingModal tutorId={bookingTutorId} onClose={() => setBookingTutorId(null)} />
      )}
    </div>
  );
}
