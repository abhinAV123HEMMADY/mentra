export interface LessonContent {
  topic_name: string;
  overview: string;
  worked_examples: { difficulty: string; prompt: string; solution: string }[];
  common_mistakes: string[];
  lesson_id?: string;
}

export interface QuizQuestion {
  question: string;
  answer: string;
  correct: boolean;
  modality_attempts: string[];
  reexplanations: Record<string, unknown>;
  needs_video: boolean;
}

export interface Flashcard {
  id?: string;
  front: string;
  back: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  due_date: string;
}

export interface VideoResult {
  video_id: string;
  title: string;
  start_seconds: number;
  url: string;
  relevance: number;
}

export interface TutorResult {
  id: string;
  name: string;
  subjects: string[];
  verification_tier: string;
  rating: number;
  response_time_percentile: number;
  price_per_hour: number;
  session_format: string;
  relevance: number;
}

export interface PipelineUpdate {
  node: string;
  update: Record<string, unknown>;
}

export interface LearningSessionData {
  lesson?: LessonContent;
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  videos?: VideoResult[];
  tutor_matches?: TutorResult[];
  mastery_score?: number;
  prerequisite_gap?: string | null;
  done: boolean;
}

export interface StruggleFeedItem {
  user_id: string;
  topic_id: string;
  topic_name: string;
  relative_signal: "struggling" | "on_track";
}

export interface SquadProposal {
  id: string;
  topic_id: string;
  member_ids: string[];
}

export type MasteryStatus = "mastered" | "decaying" | "gap" | "weak" | "untouched";

export interface MasteryNode {
  id: string;
  name: string;
  subject: string;
  mastery: number;
  retrievability: number | null;
  effective_mastery: number;
  status: MasteryStatus;
  cards_tracked: number;
}

export interface MasteryEdge {
  from: string;
  to: string;
}

export interface MasteryGraph {
  nodes: MasteryNode[];
  edges: MasteryEdge[];
  summary: {
    mastered: number;
    decaying: number;
    gaps: number;
    untouched: number;
    overall: number;
  };
}
