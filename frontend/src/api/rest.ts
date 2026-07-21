import type { MasteryGraph, SquadProposal, StruggleFeedItem, TutorResult } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

export function startLearning(learnerId: string, topicInput: string, inputMode: "text" | "photo") {
  return postJson<{ session_id: string; status: string }>("/learn", {
    learner_id: learnerId,
    topic_input: topicInput,
    input_mode: inputMode,
  });
}

export function submitConfidence(cardId: string, learnerId: string, rating: number, recalled: boolean) {
  return postJson<{ status: string; next_due_days: number }>("/learn/confidence", {
    card_id: cardId,
    learner_id: learnerId,
    rating,
    recalled,
  });
}

export function searchTutors(payload: {
  subject: string;
  topic_query: string;
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
  price_max?: number;
  session_format?: string;
  verification_tier?: string;
}) {
  return postJson<TutorResult[]>("/tutors/search", payload);
}

export function bookTutor(tutorId: string, learnerId: string, slotStart: string) {
  return postJson<{ status: string; booking_id: string | null }>("/tutors/book", {
    tutor_id: tutorId,
    learner_id: learnerId,
    slot_start: slotStart,
  });
}

export async function getTutorAvailability(tutorId: string, week: string) {
  const res = await fetch(`${API_BASE}/tutors/${tutorId}/availability?week=${encodeURIComponent(week)}`);
  return res.json() as Promise<string[]>;
}

export async function getStruggleFeed(userId: string) {
  const res = await fetch(`${API_BASE}/peer/feed/${userId}`);
  return res.json() as Promise<StruggleFeedItem[]>;
}

export async function getSquadProposals(topicId: string) {
  const res = await fetch(`${API_BASE}/peer/squads/${topicId}`);
  return res.json() as Promise<SquadProposal[]>;
}

export async function getMasteryGraph(userId: string): Promise<MasteryGraph> {
  try {
    const res = await fetch(`${API_BASE}/mastery/graph/${userId}`);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as MasteryGraph;
  } catch {
    // Fallback so the map always demos even without the backend running.
    return demoMasteryGraph(userId);
  }
}

function demoMasteryGraph(userId: string): MasteryGraph {
  // Mirrors the seeded chain (functions → limits → derivatives → integration).
  // Amy is the "weak on limits" demo learner; others get a healthier profile.
  const amy = userId === "u_amy";
  const nodes = [
    { id: "functions", name: "functions", mastery: 0.9, retr: 0.95 },
    { id: "limits", name: "limits", mastery: amy ? 0.2 : 0.82, retr: amy ? 0.6 : 0.7 },
    { id: "derivatives", name: "derivatives", mastery: amy ? 0.35 : 0.74, retr: 0.65 },
    { id: "integration-basics", name: "integration basics", mastery: 0.5, retr: 0.55 },
    { id: "integration-by-parts", name: "integration by parts", mastery: 0.0, retr: null as number | null },
  ].map((n) => {
    const effective = n.retr === null ? n.mastery : n.mastery * n.retr;
    const isPrereq = n.id !== "integration-by-parts";
    let status: MasteryGraph["nodes"][number]["status"];
    if (n.mastery === 0 && n.retr === null) status = "untouched";
    else if (effective < 0.5) status = isPrereq ? "gap" : "weak";
    else if (n.retr !== null && n.retr < 0.8) status = "decaying";
    else status = "mastered";
    return {
      id: n.id,
      name: n.name,
      subject: "math",
      mastery: n.mastery,
      retrievability: n.retr,
      effective_mastery: Number(effective.toFixed(3)),
      status,
      cards_tracked: n.retr === null ? 0 : 8,
    };
  });
  const edges = [
    { from: "functions", to: "limits" },
    { from: "limits", to: "derivatives" },
    { from: "derivatives", to: "integration-basics" },
    { from: "integration-basics", to: "integration-by-parts" },
  ];
  const summary = {
    mastered: nodes.filter((n) => n.status === "mastered").length,
    decaying: nodes.filter((n) => n.status === "decaying").length,
    gaps: nodes.filter((n) => n.status === "gap" || n.status === "weak").length,
    untouched: nodes.filter((n) => n.status === "untouched").length,
    overall: Number((nodes.reduce((s, n) => s + n.effective_mastery, 0) / nodes.length).toFixed(3)),
  };
  return { nodes, edges, summary };
}

export function postQna(topicId: string, authorId: string, body: string) {
  return postJson<{ id: string; moderation_status: string }>("/peer/qna", {
    topic_id: topicId,
    author_id: authorId,
    body,
  });
}
