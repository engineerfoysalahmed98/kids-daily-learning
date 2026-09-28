import type { Activity, BadgeDef, ChildProgress, Completion, CompletionResult, NotificationKind, Response, ScoreResult } from "../types";
import { scoreAttempt } from "./scoring";
import { advanceStreak, computeStats, isRepeat, newlyEarnedBadges, starsFor, xpFor } from "./rewards";
import { summarize } from "./progress";
import { TRACK_META } from "../content/meta";
import { clamp } from "./util";

export type CompletionInput =
  | { kind: "quiz"; responses: Record<string, Response>; seconds: number }
  | { kind: "done"; seconds: number }
  | { kind: "game"; pct: number; seconds: number };

export interface CompleteOptions {
  now: Date;
  today: string;
  badges: BadgeDef[];
  newId: () => string;
}

export interface PendingNotification { kind: NotificationKind; text: string; }

/**
 * The single place where a finished activity turns into score, stars, XP,
 * streak, badges and parent notifications. Pure: returns the next progress
 * state; callers persist it (mock store or Prisma transaction).
 */
export function completeActivity(
  progress: ChildProgress,
  activity: Activity,
  input: CompletionInput,
  opts: CompleteOptions,
): { progress: ChildProgress; result: CompletionResult; notifications: PendingNotification[] } {
  if (activity.kind === "creative" || activity.kind === "habit") {
    if (input.kind !== "done") throw new Error("This activity is completed with a 'done' result.");
  } else if (activity.kind === "game") {
    if (input.kind !== "game") throw new Error("This game is completed with a 'game' result.");
  } else if (input.kind !== "quiz") {
    throw new Error("This activity needs quiz answers.");
  }

  let score: ScoreResult | null = null;
  let pct: number | null = null;
  if (input.kind === "quiz") {
    score = scoreAttempt(activity.questions ?? [], input.responses);
    pct = score.pct;
  } else if (input.kind === "game") {
    pct = Math.round(clamp(input.pct, 0, 100));
  }

  const repeat = isRepeat(progress.completions, activity.id, opts.today);
  const stars = starsFor(activity.kind, pct);
  const xp = xpFor(activity.kind, score?.correct ?? 0, pct, repeat);
  const seconds = Math.round(clamp(input.seconds, 0, 3 * 3600));

  const completion: Completion = {
    id: opts.newId(),
    childId: progress.child.id,
    activityId: activity.id,
    track: activity.track,
    subject: activity.subject,
    title: activity.title,
    icon: activity.icon,
    day: opts.today,
    completedAt: opts.now.toISOString(),
    correct: score?.correct ?? 0,
    total: score?.total ?? 0,
    scorePct: pct,
    stars,
    xp,
    seconds,
    repeat,
  };

  const before = summarize(progress, opts.today);
  const { streak, change } = advanceStreak(progress.streak, opts.today);
  let next: ChildProgress = { ...progress, completions: [...progress.completions, completion], streak };

  const stats = computeStats(next);
  const earned = newlyEarnedBadges(opts.badges, next.badges, stats);
  if (earned.length) {
    next = { ...next, badges: [...next.badges, ...earned.map((b) => ({ badgeId: b.id, unlockedAt: opts.now.toISOString() }))] };
  }

  const after = summarize(next, opts.today);
  const goalReachedNow = before.todayDone < before.goal && after.todayDone >= after.goal;

  const name = progress.child.name;
  const notifications: PendingNotification[] = [];
  if (!repeat) {
    const scoreText = pct !== null && activity.kind !== "game" ? ` (score ${pct}%)` : "";
    notifications.push({ kind: "activity", text: `${name} completed today's ${TRACK_META[activity.track].label} activity: ${activity.title}${scoreText}.` });
  }
  for (const b of earned) notifications.push({ kind: "badge", text: `${name} earned a new badge: ${b.icon} ${b.name}!` });
  if (goalReachedNow) notifications.push({ kind: "goal", text: `${name} reached today's learning goal of ${after.goal} activities. 🎯` });

  return {
    progress: next,
    result: { completion, score, xpAwarded: xp, stars, newBadges: earned, streak, streakChanged: change, goalReachedNow, summary: after },
    notifications,
  };
}
