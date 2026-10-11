/**
 * Learning Hub progress — pure functions. Saved on the device by
 * src/state/hubStore.ts (no account, no server).
 *
 *  - `done` holds completed item ids ("bn-letter:ক", "trace:অ", "poem-read:gram" …)
 *  - quiz items ("quiz:<quizId>") count as done once the best score is ≥ 60%
 *  - one ⭐ per correct quiz answer and per first successful tracing, never twice
 */
import type { Question, Response } from "../types";
import { scoreAttempt } from "../engine/scoring";

export const HUB_PASS_PCT = 60;
const MAX_KEYS = 5000;

export interface HubProgress {
  version: 1;
  done: string[];
  quizzes: Record<string, { best: number; attempts: number }>;
  starKeys: string[];
  stars: number;
}

export function emptyHubProgress(): HubProgress {
  return { version: 1, done: [], quizzes: {}, starKeys: [], stars: 0 };
}

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const strs = (x: unknown): string[] => (Array.isArray(x) ? [...new Set(x.filter((v): v is string => typeof v === "string" && v.length <= 160))] : []);

export function parseHubProgress(raw: string | null | undefined): HubProgress {
  if (!raw) return emptyHubProgress();
  try {
    const d = JSON.parse(raw) as Partial<HubProgress>;
    if (!d || d.version !== 1) return emptyHubProgress();
    const quizzes: HubProgress["quizzes"] = {};
    for (const [k, v] of Object.entries(d.quizzes ?? {})) {
      if (k.length <= 120 && v && isNum(v.best) && isNum(v.attempts)) quizzes[k] = { best: Math.max(0, Math.min(100, v.best)), attempts: Math.max(0, Math.floor(v.attempts)) };
    }
    const starKeys = strs(d.starKeys).slice(-MAX_KEYS);
    return { version: 1, done: strs(d.done).slice(-MAX_KEYS), quizzes, starKeys, stars: isNum(d.stars) && d.stars >= 0 ? Math.floor(d.stars) : 0 };
  } catch {
    return emptyHubProgress();
  }
}

export function isDone(p: HubProgress, item: string): boolean {
  if (item.startsWith("quiz:")) return (p.quizzes[item.slice(5)]?.best ?? 0) >= HUB_PASS_PCT;
  return p.done.includes(item);
}

export function markDone(p: HubProgress, item: string): HubProgress {
  return p.done.includes(item) ? p : { ...p, done: [...p.done, item].slice(-MAX_KEYS) };
}

/** Award one star for `key` unless it was already awarded. */
export function awardStar(p: HubProgress, key: string): { progress: HubProgress; awarded: boolean } {
  if (p.starKeys.includes(key)) return { progress: p, awarded: false };
  return { progress: { ...p, stars: p.stars + 1, starKeys: [...p.starKeys, key].slice(-MAX_KEYS) }, awarded: true };
}

export interface HubQuizOutcome {
  progress: HubProgress;
  correct: number;
  total: number;
  pct: number;
  starsEarned: number;
  alreadyRewarded: number;
  passed: boolean;
}

/** Scores a finished quiz with the shared engine. Re-recording the same answers adds no stars. */
export function recordHubQuiz(p: HubProgress, quizId: string, questions: Question[], responses: Record<string, Response>): HubQuizOutcome {
  const score = scoreAttempt(questions, responses);
  let next = p;
  let starsEarned = 0;
  let alreadyRewarded = 0;
  for (const r of score.results) {
    if (!r.correct) continue;
    const res = awardStar(next, `${quizId}:${r.questionId}`);
    next = res.progress;
    if (res.awarded) starsEarned++; else alreadyRewarded++;
  }
  const prev = next.quizzes[quizId];
  next = { ...next, quizzes: { ...next.quizzes, [quizId]: { best: Math.max(prev?.best ?? 0, score.pct), attempts: (prev?.attempts ?? 0) + 1 } } };
  return { progress: next, correct: score.correct, total: score.total, pct: score.pct, starsEarned, alreadyRewarded, passed: score.pct >= HUB_PASS_PCT };
}

export function countDone(p: HubProgress, items: string[]): { done: number; total: number } {
  return { done: items.filter((i) => isDone(p, i)).length, total: items.length };
}
