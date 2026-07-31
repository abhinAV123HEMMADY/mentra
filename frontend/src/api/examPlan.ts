import type { ExamPlan } from "../types";

// Client-side port of backend/app/fsrs/exam_planner.py (same math, same constants) so the
// exam-aware planning chart demos on a static deploy without the backend — the same
// convention as demoMasteryGraph in rest.ts.

const EXAM_TARGET = 0.95;
const NATURAL_TARGET = 0.9;
const CONSOLIDATION_WINDOW = 7;

const retrievability = (stability: number, elapsed: number) =>
  (1 + elapsed / (9 * Math.max(stability, 0.1))) ** -1;

const nextInterval = (stability: number, target = NATURAL_TARGET) =>
  Math.max(Math.round(9 * stability * (1 / target - 1)), 1);

// Expected successful review at neutral confidence 3: difficulty delta 0 with mean
// reversion; stability confidence weight 0.7 + 0.15*3 = 1.15.
const updateDifficulty = (d: number) => Math.min(Math.max(d - 0.1 * (d - 5), 1), 10);
const updateStability = (s: number, d: number, r: number) =>
  Math.max(s * (1 + (11 - d) * (1 - r) * 1.15 * 0.3), 0.1);

export interface DemoCard {
  front: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
}

interface Sim {
  s: number;
  d: number;
  last: number;
  reviews: number[];
}

function makeSim(card: DemoCard): Sim {
  return { s: card.stability, d: card.difficulty, last: -card.elapsed_days, reviews: [] };
}

function review(sim: Sim, day: number) {
  const r = retrievability(sim.s, day - sim.last);
  sim.d = updateDifficulty(sim.d);
  sim.s = updateStability(sim.s, sim.d, r);
  sim.last = day;
  sim.reviews.push(day);
}

function naturalSchedule(sim: Sim, horizon: number) {
  for (;;) {
    const due = Math.max(sim.last + nextInterval(sim.s), 0);
    if (due > horizon) return;
    review(sim, due);
  }
}

function curve(card: DemoCard, reviews: number[], horizon: number): number[] {
  const replay = makeSim(card);
  const days = [...reviews].sort((a, b) => a - b);
  let next = 0;
  const out: number[] = [];
  for (let day = 0; day <= horizon; day++) {
    while (next < days.length && days[next] <= day) review(replay, days[next++]);
    out.push(retrievability(replay.s, day - replay.last));
  }
  return out;
}

export function planForExam(cards: DemoCard[], daysUntilExam: number): ExamPlan {
  const examDay = Math.max(1, daysUntilExam);
  const dailyCap = Math.max(3, Math.ceil(cards.length / 3));

  const baseline = cards.map(makeSim);
  const aware = cards.map(makeSim);
  baseline.forEach((sim) => naturalSchedule(sim, examDay - 1));
  aware.forEach((sim) => naturalSchedule(sim, examDay - 1));

  const load = new Map<number, number>();
  aware.forEach((sim) => sim.reviews.forEach((d) => load.set(d, (load.get(d) ?? 0) + 1)));
  const examR = (sim: Sim) => retrievability(sim.s, examDay - sim.last);
  const earliest = Math.max(1, examDay - CONSOLIDATION_WINDOW);

  aware
    .filter((sim) => examR(sim) < EXAM_TARGET)
    .sort((a, b) => examR(a) - examR(b))
    .forEach((sim) => {
      for (let day = examDay - 1; day >= earliest; day--) {
        if ((load.get(day) ?? 0) >= dailyCap || day <= sim.last) continue;
        review(sim, day);
        load.set(day, (load.get(day) ?? 0) + 1);
        return;
      }
    });

  const baselineCurves = cards.map((c, i) => curve(c, baseline[i].reviews, examDay));
  const awareCurves = cards.map((c, i) => curve(c, aware[i].reviews, examDay));
  const mean = (curves: number[][]) =>
    Array.from({ length: examDay + 1 }, (_, d) =>
      curves.length ? Number((curves.reduce((sum, c) => sum + c[d], 0) / curves.length).toFixed(4)) : 0,
    );

  const baselineMean = mean(baselineCurves);
  const awareMean = mean(awareCurves);

  return {
    days_until_exam: examDay,
    curve_baseline: baselineMean,
    curve_exam_aware: awareMean,
    exam_day: {
      baseline: baselineMean[examDay],
      exam_aware: awareMean[examDay],
      cards_at_risk_baseline: baselineCurves.filter((c) => c[examDay] < NATURAL_TARGET).length,
      cards_at_risk_exam_aware: awareCurves.filter((c) => c[examDay] < NATURAL_TARGET).length,
    },
    plan: cards.map((c, i) => ({
      front: c.front,
      review_days: [...aware[i].reviews].sort((a, b) => a - b),
      projected_exam_retrievability: Number(awareCurves[i][examDay].toFixed(4)),
    })),
    daily_load: Array.from({ length: examDay + 1 }, (_, d) =>
      aware.filter((sim) => sim.reviews.includes(d)).length,
    ),
    demo_deck: true,
    card_count: cards.length,
  };
}

// Mirrors routes_exam.py's _demo_deck: fresh, well-known, and neglected cards mixed.
export function demoDeck(): DemoCard[] {
  const stabilities = [0.8, 2.0, 4.5, 9.0, 16.0, 28.0];
  const difficulties = [3.5, 5.0, 6.5];
  const elapsed = [0, 2, 5, 9, 14, 21];
  return Array.from({ length: 18 }, (_, i) => ({
    front: `demo card ${i + 1}`,
    stability: stabilities[i % 6],
    difficulty: difficulties[i % 3],
    elapsed_days: elapsed[i % 6],
  }));
}
