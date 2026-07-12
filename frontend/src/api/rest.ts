import type { SquadProposal, StruggleFeedItem, TutorResult } from "../types";

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

export function postQna(topicId: string, authorId: string, body: string) {
  return postJson<{ id: string; moderation_status: string }>("/peer/qna", {
    topic_id: topicId,
    author_id: authorId,
    body,
  });
}
