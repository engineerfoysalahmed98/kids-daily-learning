import type { ActivityKind, BadgeDef, BadgeRule, ChildProgress, Completion, EarnedBadge, StreakState } from "../types";
import { addDays } from "./util";

// ---------------------------------------------------------------- stars & XP

/** Finishing always earns at least one star — effort counts. */
export function starsFor(kind: ActivityKind, pct: number | null): number {
  if (pct === null) return 3;
  if (pct >= 90) return 3;
  if (pct >= 60) return 2;
  return 1;
}

export const XP_RULES = {
  base: 10,
  perCorrect: 2,
  perfectBonus: 5,
  creative: 15,
  habit: 10,
  gameBase: 10,
  repeat: 3,
};

/**
 * XP for one completion. Repeating an activity already finished today still
 * earns a little XP (practice is good) but not the full amount, so there's
 * nothing to grind.
 */
export function xpFor(kind: ActivityKind, correct: number, pct: number | null, repeat: boolean): number {
  if (repeat) return XP_RULES.repeat;
  if (kind === "creative") return XP_RULES.creative;
  if (kind === "habit") return XP_RULES.habit;
  if (kind === "game" && pct !== null) return XP_RULES.gameBase + Math.round(pct / 10);
  return XP_RULES.base + correct * XP_RULES.perCorrect + (pct === 100 ? XP_RULES.perfectBonus : 0);
}

// ---------------------------------------------------------------- streaks

export type StreakChange = "started" | "extended" | "same" | "restarted";

/** Called when the child completes something on `day`. Missing days restart gently at 1. */
export function advanceStreak(s: StreakState, day: string): { streak: StreakState; change: StreakChange } {
  if (s.lastDay === day) return { streak: s, change: "same" };
  let current: number;
  let change: StreakChange;
  if (s.lastDay && addDays(s.lastDay, 1) === day) { current = s.current + 1; change = "extended"; }
  else if (!s.lastDay) { current = 1; change = "started"; }
  else { current = 1; change = "restarted"; }
  return { streak: { current, longest: Math.max(s.longest, current), lastDay: day }, change };
}

/** Streak as the child should see it today (0 if they missed yesterday — shown kindly). */
export function visibleStreak(s: StreakState, today: string): number {
  if (!s.lastDay) return 0;
  if (s.lastDay === today || addDays(s.lastDay, 1) === today) return s.current;
  return 0;
}

export function streakMessage(s: StreakState, today: string): string {
  const n = visibleStreak(s, today);
  if (n === 0 && s.lastDay) return "Welcome back! Every day is a fresh start. 🌱";
  if (n === 0) return "Finish one activity to start your streak! ✨";
  if (s.lastDay !== today) return `You're on a ${n}-day streak! One activity keeps it going. 🔥`;
  if (n >= 7) return `You're on a ${n}-day learning streak! Keep going! 🚀`;
  if (n >= 3) return `${n} days in a row — you're on fire! 🔥`;
  return `${n}-day streak! Great start! ⭐`;
}

export const STREAK_MILESTONES = [1, 2, 3, 7, 14, 30];

// ---------------------------------------------------------------- badges

export interface BadgeStats {
  activities: number;
  perTrack: Record<string, number>;
  perfect: number;
  perfectPerTrack: Record<string, number>;
  goalDays: number;
  longestStreak: number;
  xp: number;
}

export function computeStats(p: Pick<ChildProgress, "completions" | "streak" | "child">): BadgeStats {
  const firsts = p.completions.filter((c) => !c.repeat);
  const perTrack: Record<string, number> = {};
  const perfectPerTrack: Record<string, number> = {};
  let perfect = 0;
  for (const c of firsts) {
    perTrack[c.track] = (perTrack[c.track] ?? 0) + 1;
    if (c.scorePct === 100) { perfect++; perfectPerTrack[c.track] = (perfectPerTrack[c.track] ?? 0) + 1; }
  }
  const perDay: Record<string, number> = {};
  for (const c of firsts) perDay[c.day] = (perDay[c.day] ?? 0) + 1;
  const goal = p.child.settings.dailyGoal;
  const goalDays = Object.values(perDay).filter((n) => n >= goal).length;
  const xp = p.completions.reduce((s, c) => s + c.xp, 0);
  return { activities: firsts.length, perTrack, perfect, perfectPerTrack, goalDays, longestStreak: p.streak.longest, xp };
}

export function ruleMet(rule: BadgeRule, s: BadgeStats): boolean {
  switch (rule.kind) {
    case "activities": return s.activities >= rule.count;
    case "track": return (s.perTrack[rule.track] ?? 0) >= rule.count;
    case "streak": return s.longestStreak >= rule.days;
    case "perfect": return (rule.track ? s.perfectPerTrack[rule.track] ?? 0 : s.perfect) >= rule.count;
    case "goal-days": return s.goalDays >= rule.count;
    case "xp": return s.xp >= rule.amount;
  }
}

/** 0–1 progress toward a badge, for the locked-badge progress bars. */
export function ruleProgress(rule: BadgeRule, s: BadgeStats): { value: number; target: number } {
  switch (rule.kind) {
    case "activities": return { value: Math.min(s.activities, rule.count), target: rule.count };
    case "track": return { value: Math.min(s.perTrack[rule.track] ?? 0, rule.count), target: rule.count };
    case "streak": return { value: Math.min(s.longestStreak, rule.days), target: rule.days };
    case "perfect": return { value: Math.min(rule.track ? s.perfectPerTrack[rule.track] ?? 0 : s.perfect, rule.count), target: rule.count };
    case "goal-days": return { value: Math.min(s.goalDays, rule.count), target: rule.count };
    case "xp": return { value: Math.min(s.xp, rule.amount), target: rule.amount };
  }
}

export function newlyEarnedBadges(defs: BadgeDef[], owned: EarnedBadge[], stats: BadgeStats): BadgeDef[] {
  const have = new Set(owned.map((b) => b.badgeId));
  return defs.filter((d) => !have.has(d.id) && ruleMet(d.rule, stats));
}

export function isRepeat(completions: Completion[], activityId: string, day: string): boolean {
  // Daily activities: once per day. Everything else: full XP once per day per id.
  return completions.some((c) => c.activityId === activityId && c.day === day && !c.repeat);
}
