import type { ExamPlan, MasteryGraph, ProtegeTurnResult, SquadProposal, StruggleFeedItem, TutorResult } from "../types";
import { demoDeck, planForExam } from "./examPlan";
import {
  DEMO_SQUADS,
  DEMO_STRUGGLE_FEED,
  DEMO_TUTORS,
  demoProtegeTurn,
  demoStartProtege,
} from "./demo";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// Every endpoint falls back to the client-side demo layer (demo.ts / examPlan.ts) when the
// backend isn't reachable, so a static deploy of just this frontend demos every feature.

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
  // No fallback here — LearningPipeline handles offline mode itself so it can simulate the
  // streaming updates, not just the initial POST.
  return postJson<{ session_id: string; status: string }>("/learn", {
    learner_id: learnerId,
    topic_input: topicInput,
    input_mode: inputMode,
  });
}

export async function submitConfidence(cardId: string, learnerId: string, rating: number, recalled: boolean) {
  try {
    return await postJson<{ status: string; next_due_days: number }>("/learn/confidence", {
      card_id: cardId,
      learner_id: learnerId,
      rating,
      recalled,
    });
  } catch {
    return { status: "ok", next_due_days: recalled ? Math.max(1, rating * 2) : 1 };
  }
}

export async function getExamPlan(learnerId: string, daysUntilExam: number): Promise<ExamPlan> {
  try {
    return await postJson<ExamPlan>("/exam/plan", {
      learner_id: learnerId,
      days_until_exam: daysUntilExam,
    });
  } catch {
    return planForExam(demoDeck(), daysUntilExam);
  }
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

export async function getStruggleFeed(userId: string): Promise<StruggleFeedItem[]> {
  try {
    return await getJson<StruggleFeedItem[]>(`/peer/feed/${userId}`);
  } catch {
    return DEMO_STRUGGLE_FEED.filter((i) => i.user_id !== userId);
  }
}

export async function getSquadProposals(topicId: string): Promise<SquadProposal[]> {
  try {
    return await getJson<SquadProposal[]>(`/peer/squads/${topicId}`);
  } catch {
    return DEMO_SQUADS.filter((s) => s.topic_id === topicId);
  }
}

export async function getMasteryGraph(userId: string): Promise<MasteryGraph> {
  try {
    return await getJson<MasteryGraph>(`/mastery/graph/${userId}`);
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

export async function postQna(topicId: string, authorId: string, body: string) {
  try {
    return await postJson<{ id: string; moderation_status: string }>("/peer/qna", {
      topic_id: topicId,
      author_id: authorId,
      body,
    });
  } catch {
    return { id: "demo-qna", moderation_status: "approved" };
  }
}

export async function startProtege(topicId: string, learnerId: string): Promise<ProtegeTurnResult> {
  try {
    return await postJson<ProtegeTurnResult>("/protege/start", { topic_id: topicId, learner_id: learnerId });
  } catch {
    return demoStartProtege();
  }
}

export async function sendProtegeTurn(sessionId: string, learnerExplanation: string): Promise<ProtegeTurnResult> {
  try {
    return await postJson<ProtegeTurnResult>("/protege/turn", {
      session_id: sessionId,
      learner_explanation: learnerExplanation,
    });
  } catch {
    return demoProtegeTurn(sessionId, learnerExplanation);
  }
}

export async function publishProtegeExplanation(sessionId: string) {
  try {
    return await postJson<{ id: string; moderation_status: string }>("/protege/publish", { session_id: sessionId });
  } catch {
    return { id: `demo-${sessionId}`, moderation_status: "approved" };
  }
}
