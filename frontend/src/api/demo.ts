import type {
  ErrorAnalysis,
  PipelineUpdate,
  ProtegeTurnResult,
  SquadProposal,
  StruggleFeedItem,
  TutorResult,
} from "../types";

// Client-side demo layer: when the backend isn't reachable (e.g. the static deploy), every
// feature still runs on realistic canned data — extending rest.ts's demoMasteryGraph
// convention to the pipeline, Protégé Mode, and the peer/tutor surfaces. Content mirrors
// the backend's deterministic stubs and seed data.

// ---------- Learning pipeline ----------

const DEMO_ERROR_ANALYSIS: ErrorAnalysis = {
  problem_statement: "∫ x·cos(x) dx",
  steps: [
    { text: "Let u = x, dv = cos(x) dx", correct: true },
    { text: "du = dx, v = sin(x)", correct: true },
    { text: "∫ x·cos(x) dx = x·sin(x) − ∫ sin(x) dx", correct: true },
    {
      text: "= x·sin(x) − cos(x) + C",
      correct: false,
      note: "The integral of sin(x) is −cos(x); subtracting it gives +cos(x). Sign error rooted in the derivative/antiderivative pairs.",
    },
  ],
  first_error_step: 3,
  error_explanation:
    "The setup of integration by parts is correct — the slip is in the final antiderivative of sin(x), which is a derivatives-level fact, not an integration-by-parts fact.",
  tested_concept: "integration by parts",
  prerequisite_concept: "derivatives",
  prerequisite_topic_id: "derivatives",
};

function demoLesson(topic: string) {
  if (topic === "limits") {
    return {
      topic_name: "limits",
      overview:
        "A limit describes the value a function approaches as its input approaches a point — even when the function never actually reaches it. Limits are the foundation derivatives are built on: a derivative is literally a limit of slopes.",
      worked_examples: [
        {
          difficulty: "easy",
          prompt: "Evaluate lim(x→3) of (x² − 9)/(x − 3).",
          solution:
            "1. Plugging in x = 3 gives 0/0 — indeterminate.\n2. Factor: (x² − 9) = (x − 3)(x + 3).\n3. Cancel (x − 3): the expression becomes x + 3.\n4. Now substitute: 3 + 3 = 6.",
        },
        {
          difficulty: "medium",
          prompt: "Evaluate lim(x→0) of sin(x)/x.",
          solution:
            "1. Direct substitution gives 0/0.\n2. This is the classic squeeze-theorem limit: cos(x) ≤ sin(x)/x ≤ 1 near 0.\n3. Both bounds approach 1 as x→0, so the limit is 1.",
        },
      ],
      common_mistakes: [
        "Concluding a limit 'doesn't exist' whenever direct substitution gives 0/0 — indeterminate means 'do more work', not 'no answer'.",
        "Confusing the limit of f(x) as x→a with the value f(a) — the function doesn't even need to be defined at a.",
      ],
    };
  }
  if (topic === "derivatives") {
    return {
      topic_name: "derivatives",
      overview:
        "The derivative measures instantaneous rate of change — the slope of the tangent line at a single point. It turns 'how fast is this changing right now?' into a computable number, and it's the tool the snapped problem actually depended on.",
      worked_examples: [
        {
          difficulty: "easy",
          prompt: "Differentiate f(x) = x³ + 5.",
          solution:
            "1. Power rule on x³: bring the exponent down, reduce it by one → 3x².\n2. The constant 5 never changes as x changes, so its derivative is 0.\n3. f′(x) = 3x².",
        },
        {
          difficulty: "medium",
          prompt: "What are the antiderivative pairs for sin and cos? (The snapped problem's failure point.)",
          solution:
            "1. d/dx[sin(x)] = cos(x), so ∫cos(x)dx = sin(x) + C.\n2. d/dx[cos(x)] = −sin(x), so ∫sin(x)dx = −cos(x) + C.\n3. In the snapped problem: x·sin(x) − ∫sin(x)dx = x·sin(x) − (−cos(x)) = x·sin(x) + cos(x) + C.",
        },
      ],
      common_mistakes: [
        "Dropping the minus sign on ∫sin(x)dx = −cos(x) + C — exactly the error in the snapped work.",
        "Multiplying two derivatives together for a product instead of using the product rule.",
      ],
    };
  }
  return {
    topic_name: topic,
    overview: `${topic} builds on a small set of core ideas. This lesson walks through the definition, a worked example, and the mistakes learners most often make.`,
    worked_examples: [
      { difficulty: "easy", prompt: `A basic ${topic} example.`, solution: "Step-by-step solution would go here." },
      { difficulty: "medium", prompt: `A more involved ${topic} example.`, solution: "Step-by-step solution would go here." },
    ],
    common_mistakes: [
      `Forgetting a key step specific to ${topic}.`,
      "Applying the right method to the wrong part of the problem.",
    ],
  };
}

function demoQuiz(topic: string) {
  return [
    {
      question: `What is the defining property of ${topic}?`,
      answer: "See lesson overview.",
      correct: false,
      modality_attempts: ["analogy", "diagram"],
      reexplanations: {
        analogy: `Think of ${topic} like zooming a camera: the closer you look, the simpler the picture gets — the concept is what the picture settles toward.`,
        diagram: `[curve] → zoom → [straight line]\nThe idea of ${topic}, drawn as what happens when you look closer and closer.`,
      },
      needs_video: true,
    },
    {
      question: `Apply ${topic} to a simple worked example.`,
      answer: "See worked examples.",
      correct: true,
      modality_attempts: [],
      reexplanations: {},
      needs_video: false,
    },
  ];
}

function demoFlashcards(topic: string) {
  const today = new Date().toISOString();
  return [
    { id: "demo-1", front: `Define ${topic} in one sentence.`, back: "See lesson overview.", stability: 1, difficulty: 5, elapsed_days: 0, due_date: today },
    { id: "demo-2", front: `The most common mistake with ${topic}?`, back: "See common mistakes.", stability: 1, difficulty: 5, elapsed_days: 0, due_date: today },
    { id: "demo-3", front: `Walk through the easy worked example of ${topic}.`, back: "See worked examples.", stability: 1, difficulty: 5, elapsed_days: 0, due_date: today },
  ];
}

const DEMO_VIDEOS = [
  { video_id: "v1", title: "The concept, visualized", start_seconds: 312, url: "https://example.com/v1", relevance: 0.93 },
  { video_id: "v2", title: "Worked problems, start to finish", start_seconds: 128, url: "https://example.com/v2", relevance: 0.88 },
];

export const DEMO_TUTORS: TutorResult[] = [
  { id: "t_maria", name: "Maria Chen", subjects: ["math", "calculus"], verification_tier: "background_checked", rating: 4.9, response_time_percentile: 0.95, price_per_hour: 45, session_format: "both", relevance: 0.94 },
  { id: "t_ravi", name: "Ravi Patel", subjects: ["math", "physics"], verification_tier: "background_checked", rating: 4.8, response_time_percentile: 0.9, price_per_hour: 55, session_format: "in_person", relevance: 0.87 },
  { id: "t_sam", name: "Sam Okafor", subjects: ["math"], verification_tier: "basic", rating: 4.6, response_time_percentile: 0.8, price_per_hour: 30, session_format: "virtual", relevance: 0.81 },
];

/** Simulates the streaming pipeline offline: same node order, same shapes, staged delays. */
export function runDemoPipeline(
  topic: string,
  mode: "text" | "photo",
  onUpdate: (msg: PipelineUpdate) => void,
): () => void {
  const photo = mode === "photo";
  // Photo mode diagnoses the snapped work and redirects at the revealed prerequisite;
  // "derivatives" mirrors the seeded Amy-is-weak-on-limits redirect.
  const target = photo ? "derivatives" : topic.toLowerCase() === "derivatives" ? "limits" : topic;
  const gap = photo ? "derivatives" : topic.toLowerCase() === "derivatives" ? "limits" : null;

  const updates: PipelineUpdate[] = [];
  if (photo) updates.push({ node: "snap_a_problem", update: { error_analysis: DEMO_ERROR_ANALYSIS } });
  updates.push(
    { node: "prerequisite_graph", update: { prerequisite_gap: gap } },
    { node: "lesson_generator", update: { lesson: demoLesson(target) } },
    { node: "quiz_agent", update: { quiz: demoQuiz(target) } },
    { node: "flashcard_agent", update: { flashcards: demoFlashcards(target) } },
    { node: "video_curator", update: { videos: DEMO_VIDEOS } },
    { node: "tutor_matcher", update: { tutor_matches: DEMO_TUTORS } },
    { node: "mastery_scorer", update: { mastery_score: photo ? 0.41 : 0.58 } },
    { node: "_done", update: {} },
  );

  const timers = updates.map((u, i) => setTimeout(() => onUpdate(u), 450 + i * 700));
  return () => timers.forEach(clearTimeout);
}

// ---------- Protégé Mode ----------

interface DemoMisconception {
  id: string;
  sub_concept: string;
  misconception_prompt: string;
  keywords: string[];
  hint: string;
  explanation: string;
}

// The seeded derivatives misconception set (backend/scripts/seed.py), verbatim.
const MISCONCEPTIONS: DemoMisconception[] = [
  {
    id: "constant-vanishes",
    sub_concept: "Constants have derivative zero because they don't change with x",
    misconception_prompt: "Wait, why does the +5 just disappear when you take the derivative? Doesn't the 5 matter for the answer?",
    keywords: ["rate of change", "doesn't change", "constant", "flat", "slope of zero", "no x"],
    hint: "A derivative measures how much something changes as x changes. Ask yourself: does the +5 change at all as x moves?",
    explanation: "A derivative measures the rate of change with respect to x. A constant like +5 never changes as x changes, so it contributes nothing to the rate of change — it drops out, even though the function's actual value is still shifted by 5.",
  },
  {
    id: "power-rule-mechanics",
    sub_concept: "The power rule multiplies by the exponent and drops it by one — the exponent doesn't just vanish",
    misconception_prompt: "Okay so x^3 becomes x^2 — but why does the exponent just go down by one for no reason? What happened to the 3?",
    keywords: ["multiply", "coefficient", "bring down", "n times", "n*x", "exponent minus"],
    hint: "The 3 doesn't disappear — it moves. Try writing out x^3 as x*x*x and think about where a factor of 3 could come from.",
    explanation: "The power rule comes from expanding x^n and differentiating term by term: the exponent becomes a multiplier out front, and the power on x drops by one — d/dx[x^3] = 3x^2. The 3 doesn't vanish, it moves from the exponent to become a coefficient.",
  },
  {
    id: "derivative-vs-tangent-slope",
    sub_concept: "The derivative at a point IS the slope of the tangent line there, not a separate related idea",
    misconception_prompt: "Is the derivative a totally different thing from the slope of the tangent line, or are those actually the same number?",
    keywords: ["tangent", "slope", "same thing", "equals the slope", "instantaneous"],
    hint: "Picture zooming into the curve at one point until it looks like a straight line — what does that line's steepness equal?",
    explanation: "The derivative at a point is defined exactly as the slope of the tangent line to the curve at that point — they're the same number, not two related-but-different ideas.",
  },
  {
    id: "average-vs-instantaneous-rate",
    sub_concept: "Average rate of change over an interval is different from the instantaneous rate at one point",
    misconception_prompt: "If I already know the average speed over the whole trip, isn't that the same as the derivative at any moment during it?",
    keywords: ["instantaneous", "average", "one point", "single moment", "not the same", "interval"],
    hint: "Think of a car trip: the average speed for the whole drive can be 40mph even if the car was stopped at a light at one moment. Are those two numbers describing the same thing?",
    explanation: "Average rate of change is the slope between two points over an interval — total change divided by total time. The derivative is the instantaneous rate at one exact point. A car's average speed for a whole trip can differ a lot from its speedometer reading at any single moment.",
  },
  {
    id: "product-rule-not-multiply-derivatives",
    sub_concept: "The derivative of a product isn't just the product of the two derivatives — it needs the product rule",
    misconception_prompt: "For f(x) = x^2 * sin(x), can't I just take the derivative of x^2 and the derivative of sin(x) separately and multiply them?",
    keywords: ["product rule", "f'g", "fg'", "first times derivative", "can't just multiply"],
    hint: "Try it on something simple like x^2 * x^2 (which is just x^4). Does multiplying the two separate derivatives (2x)(2x) actually give you the derivative of x^4?",
    explanation: "For a product f(x)g(x), the derivative is f'(x)g(x) + f(x)g'(x) — you can't just multiply the two derivatives together, because that misses how each function's change interacts with the other function's current value.",
  },
];

const STUCK_PHRASES = ["i don't know", "i dont know", "idk", "not sure", "no idea", "no clue", "i give up"];
const WRAP_UP = "Ohh, okay — I think I actually get it now. Thanks for walking me through it!";

interface DemoProtegeSession {
  checklist: Record<string, boolean>;
  stuckStreak: number;
}

const sessions = new Map<string, DemoProtegeSession>();

const isStuck = (text: string) => {
  const lowered = text.trim().toLowerCase();
  return lowered.length < 4 || STUCK_PHRASES.some((p) => lowered.includes(p));
};

function result(sessionId: string, s: DemoProtegeSession, personaMessage: string): ProtegeTurnResult {
  const covered = Object.values(s.checklist).filter(Boolean).length;
  return {
    session_id: sessionId,
    persona_message: personaMessage,
    understanding_score: Number((covered / MISCONCEPTIONS.length).toFixed(3)),
    checklist: MISCONCEPTIONS.map((m) => ({ id: m.id, sub_concept: m.sub_concept, covered: s.checklist[m.id] })),
    resolved_misconceptions: MISCONCEPTIONS.filter((m) => s.checklist[m.id]).map((m) => m.id),
    status: covered === MISCONCEPTIONS.length ? "completed" : "active",
  };
}

export function demoStartProtege(): ProtegeTurnResult {
  const sessionId = `demo-${Math.random().toString(36).slice(2, 10)}`;
  const s: DemoProtegeSession = { checklist: Object.fromEntries(MISCONCEPTIONS.map((m) => [m.id, false])), stuckStreak: 0 };
  sessions.set(sessionId, s);
  return result(sessionId, s, MISCONCEPTIONS[0].misconception_prompt);
}

/** Port of the backend's deterministic scorer + persona stubs (keyword match, hint on a
 * first punt, explain-and-move-on after two punts in a row). */
export function demoProtegeTurn(sessionId: string, explanation: string): ProtegeTurnResult {
  const s = sessions.get(sessionId);
  if (!s) return demoStartProtege();

  const open = () => MISCONCEPTIONS.filter((m) => !s.checklist[m.id]);

  if (isStuck(explanation)) {
    s.stuckStreak += 1;
    const current = open()[0];
    if (!current) return result(sessionId, s, WRAP_UP);
    if (s.stuckStreak >= 2) {
      s.stuckStreak = 0;
      s.checklist[current.id] = true;
      const rest = open();
      const lead = `That's alright, let's move on — ${current.explanation}`;
      return result(sessionId, s, rest.length ? `${lead} Okay, here's something else I'm stuck on: ${rest[0].misconception_prompt}` : `${lead} ${WRAP_UP}`);
    }
    return result(sessionId, s, `No worries — here's a nudge: ${current.hint} Want to take another shot at it?`);
  }

  s.stuckStreak = 0;
  const lowered = explanation.toLowerCase();
  open()
    .filter((m) => m.keywords.some((k) => lowered.includes(k.toLowerCase())))
    .forEach((m) => {
      s.checklist[m.id] = true;
    });

  const rest = open();
  return result(sessionId, s, rest.length ? rest[0].misconception_prompt : WRAP_UP);
}

// ---------- Peer layer ----------

export const DEMO_STRUGGLE_FEED: StruggleFeedItem[] = [
  { user_id: "u_ben", topic_id: "derivatives", topic_name: "derivatives", relative_signal: "struggling" },
  { user_id: "u_cara", topic_id: "derivatives", topic_name: "derivatives", relative_signal: "struggling" },
  { user_id: "u_dev", topic_id: "limits", topic_name: "limits", relative_signal: "struggling" },
  { user_id: "u_ella", topic_id: "integration-basics", topic_name: "integration basics", relative_signal: "on_track" },
];

export const DEMO_SQUADS: SquadProposal[] = [
  { id: "sq-demo", topic_id: "derivatives", member_ids: ["u_amy", "u_ben", "u_cara"] },
];
