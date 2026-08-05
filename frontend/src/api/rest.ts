import type { ExamPlan, MasteryGraph, MentraUser, ProtegeTurnResult, SquadProposal, StruggleFeedItem, TutorResult } from "../types";
import { DEMO_TUTORS } from "./demo";

// Production builds default to the hosted backend so a static deploy works without any
// dashboard env config; VITE_API_BASE_URL still overrides when set.
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? "https://mentra-backend-mats.onrender.com" : "http://localhost:8000");

// Only tutor search/booking falls back to canned data (there's no real tutor marketplace to
// query) — every other endpoint reflects real backend state or fails loudly. No client-side
// simulation of lessons, quizzes, mastery, or Protégé Mode: if the backend is unreachable,
// callers see a real error and the UI shows an honest "couldn't load" state.

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
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
  return postJson<{ status: string; next_due_days: number; mastery_score: number | null; topic_id: string | null }>(
    "/learn/confidence",
    {
      card_id: cardId,
      learner_id: learnerId,
      rating,
      recalled,
    },
  );
}

export function submitQuizAnswer(lessonId: string, question: string, correct: boolean, modalityUsed?: string) {
  return postJson<{ status: string; mastery_score: number | null; topic_id: string }>("/learn/quiz-answer", {
    lesson_id: lessonId,
    question,
    correct,
    modality_used: modalityUsed ?? null,
  });
}

export function listUsers() {
  return getJson<MentraUser[]>("/users");
}

export function createUser(name: string, gradeLevel?: string) {
  return postJson<MentraUser>("/users", { name, grade_level: gradeLevel ?? null });
}

export function getExamPlan(learnerId: string, daysUntilExam: number): Promise<ExamPlan> {
  return postJson<ExamPlan>("/exam/plan", {
    learner_id: learnerId,
    days_until_exam: daysUntilExam,
  });
}

export async function searchTutors(payload: {
  subject: string;
  topic_query: string;
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
  price_max?: number;
  session_format?: string;
  verification_tier?: string;
}): Promise<TutorResult[]> {
  try {
    return await postJson<TutorResult[]>("/tutors/search", payload);
  } catch {
    // The only intentionally-fake data in the app: there's no real tutor marketplace behind
    // this, so a canned directory stands in for it regardless of backend availability.
    return DEMO_TUTORS.filter(
      (t) =>
        (payload.price_max == null || t.price_per_hour <= payload.price_max) &&
        (!payload.session_format || t.session_format === payload.session_format || t.session_format === "both") &&
        (!payload.verification_tier || t.verification_tier === payload.verification_tier),
    );
  }
}

export async function bookTutor(tutorId: string, learnerId: string, slotStart: string) {
  try {
    return await postJson<{ status: string; booking_id: string | null }>("/tutors/book", {
      tutor_id: tutorId,
      learner_id: learnerId,
      slot_start: slotStart,
    });
  } catch {
    return { status: "confirmed", booking_id: `demo-${tutorId}` };
  }
}

export async function getTutorAvailability(tutorId: string, week: string) {
  try {
    return await getJson<string[]>(`/tutors/${tutorId}/availability?week=${encodeURIComponent(week)}`);
  } catch {
    const base = new Date(week || Date.now());
    return [10, 14, 16].map((h) => {
      const d = new Date(base);
      d.setDate(d.getDate() + 1);
      d.setHours(h, 0, 0, 0);
      return d.toISOString();
    });
  }
}

export function getStruggleFeed(userId: string): Promise<StruggleFeedItem[]> {
  return getJson<StruggleFeedItem[]>(`/peer/feed/${userId}`);
}

export function getSquadProposals(topicId: string): Promise<SquadProposal[]> {
  return getJson<SquadProposal[]>(`/peer/squads/${topicId}`);
}

export function getMasteryGraph(userId: string): Promise<MasteryGraph> {
  return getJson<MasteryGraph>(`/mastery/graph/${userId}`);
}

export function postQna(topicId: string, authorId: string, body: string) {
  return postJson<{ id: string; moderation_status: string }>("/peer/qna", {
    topic_id: topicId,
    author_id: authorId,
    body,
  });
}

export function startProtege(topicName: string, learnerId: string): Promise<ProtegeTurnResult> {
  return postJson<ProtegeTurnResult>("/protege/start", { topic_name: topicName, learner_id: learnerId });
}

export function sendProtegeTurn(sessionId: string, learnerExplanation: string): Promise<ProtegeTurnResult> {
  return postJson<ProtegeTurnResult>("/protege/turn", {
    session_id: sessionId,
    learner_explanation: learnerExplanation,
  });
}

export function publishProtegeExplanation(sessionId: string) {
  return postJson<{ id: string; moderation_status: string }>("/protege/publish", { session_id: sessionId });
}
