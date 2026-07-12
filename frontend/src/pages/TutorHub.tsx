import { useState } from "react";
import { searchTutors } from "../api/rest";
import BookingModal from "../components/BookingModal";
import TutorCard from "../components/TutorCard";
import type { TutorResult } from "../types";

export default function TutorHub() {
  const [topicQuery, setTopicQuery] = useState("derivatives");
  const [priceMax, setPriceMax] = useState<string>("");
  const [format, setFormat] = useState<string>("");
  const [verificationTier, setVerificationTier] = useState<string>("");
  const [results, setResults] = useState<TutorResult[]>([]);
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
  };

  return (
    <div>
      <h2>Tutor Hub</h2>
      <div className="card">
        <div className="row">
          <input value={topicQuery} onChange={(e) => setTopicQuery(e.target.value)} placeholder="topic" />
          <input
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="max $/hr"
            style={{ width: 100 }}
          />
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">any format</option>
            <option value="virtual">virtual</option>
            <option value="in_person">in person</option>
          </select>
          <select value={verificationTier} onChange={(e) => setVerificationTier(e.target.value)}>
            <option value="">any tier</option>
            <option value="unverified">unverified</option>
            <option value="basic">basic</option>
            <option value="background_checked">background checked</option>
          </select>
          <button onClick={search}>Search</button>
        </div>
      </div>

      <div className="grid">
        {results.map((t) => (
          <TutorCard key={t.id} tutor={t} onBook={() => setBookingTutorId(t.id)} />
        ))}
      </div>

      {bookingTutorId && <BookingModal tutorId={bookingTutorId} onClose={() => setBookingTutorId(null)} />}
    </div>
  );
}
