import type { TutorResult } from "../types";

// The only intentionally-fake data in the app: there's no real tutor marketplace behind
// tutor search, so a canned directory stands in for it (see searchTutors in rest.ts).
export const DEMO_TUTORS: TutorResult[] = [
  { id: "t_maria", name: "Maria Chen", subjects: ["math", "calculus"], verification_tier: "background_checked", rating: 4.9, response_time_percentile: 0.95, price_per_hour: 45, session_format: "both", relevance: 0.94 },
  { id: "t_ravi", name: "Ravi Patel", subjects: ["math", "physics"], verification_tier: "background_checked", rating: 4.8, response_time_percentile: 0.9, price_per_hour: 55, session_format: "in_person", relevance: 0.87 },
  { id: "t_sam", name: "Sam Okafor", subjects: ["math"], verification_tier: "basic", rating: 4.6, response_time_percentile: 0.8, price_per_hour: 30, session_format: "virtual", relevance: 0.81 },
];
