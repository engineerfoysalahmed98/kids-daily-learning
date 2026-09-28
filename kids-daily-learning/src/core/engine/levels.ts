import type { AgeGroup, Child, Completion, Level, Track } from "../types";
import { clamp } from "./util";

export function ageGroupFor(age: number, groups: AgeGroup[]): AgeGroup {
  return groups.find((g) => age >= g.minAge && age <= g.maxAge)
    ?? (age < groups[0].minAge ? groups[0] : groups[groups.length - 1]);
}

export function baseLevel(age: number, groups: AgeGroup[]): Level {
  return ageGroupFor(age, groups).baseLevel;
}

export interface LevelDecision {
  level: Level;
  base: Level;
  recentAvg: number | null;
  attempts: number;
  reason: string;
}

/**
 * Adaptive difficulty for one track.
 * Inputs (spec §4): child age → base level; previous performance, completed
 * activities and quiz scores → adjustment of at most one level either way.
 * Only history from *before* `day` is used, so a day's plan never shifts
 * while the child is working through it.
 */
export function decideLevel(child: Child, track: Track, history: Completion[], day: string, groups: AgeGroup[]): LevelDecision {
  const base = baseLevel(child.age, groups);
  const past = history
    .filter((c) => c.track === track && c.day < day && c.scorePct !== null && !c.repeat)
    .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
    .slice(0, 5);

  if (past.length < 2) {
    return { level: base, base, recentAvg: past[0]?.scorePct ?? null, attempts: past.length, reason: `Starting at level ${base} for age ${child.age}.` };
  }
  const avg = past.reduce((s, c) => s + (c.scorePct ?? 0), 0) / past.length;
  let level = base;
  let reason = `Recent scores average ${Math.round(avg)}% — staying at level ${base}.`;
  if (avg >= 85 && past.length >= 3) {
    level = clamp(base + 1, 1, 5) as Level;
    reason = `Recent scores average ${Math.round(avg)}% — moving up a level.`;
  } else if (avg < 50) {
    level = clamp(base - 1, 1, 5) as Level;
    reason = `Recent scores average ${Math.round(avg)}% — practising an easier level for now.`;
  }
  return { level, base, recentAvg: Math.round(avg), attempts: past.length, reason };
}
