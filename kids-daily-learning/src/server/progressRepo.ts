import "server-only";
import type { Child as DbChild, ChildSettings as DbSettings } from "@prisma/client";
import type { Child, ChildProgress, ChildSettings, Completion, CompletionResult, ContentStore, SubjectId, Track } from "@/core/types";
import { ALL_TRACKS } from "@/core/types";
import { completeActivity, decideLevel, mastery, type CompletionInput, type PendingNotification } from "@/core/engine";
import type { Activity } from "@/core/types";
import { db } from "./db";

export const DEFAULT_SETTINGS: ChildSettings = { dailyGoal: 5, screenTimeMinutes: 45, allowedTracks: [...ALL_TRACKS], aiEnabled: true, soundOn: true, largeText: false };

export function toChild(c: DbChild & { settings: DbSettings | null }): Child {
  const s = c.settings;
  return {
    id: c.id, parentId: c.parentId, name: c.name, age: c.age, avatar: c.avatar, createdAt: c.createdAt.toISOString(),
    settings: s ? {
      dailyGoal: s.dailyGoal, screenTimeMinutes: s.screenTimeMinutes, allowedTracks: s.allowedTracks.filter((t): t is Track => (ALL_TRACKS as string[]).includes(t)),
      aiEnabled: s.aiEnabled, soundOn: s.soundOn, largeText: s.largeText,
    } : DEFAULT_SETTINGS,
  };
}

/** Rebuilds the engine's ChildProgress aggregate from PostgreSQL. */
export async function loadProgress(child: Child): Promise<ChildProgress> {
  const [attempts, badges, streak, usage] = await Promise.all([
    db.quizAttempt.findMany({ where: { childId: child.id }, orderBy: { completedAt: "asc" } }),
    db.childBadge.findMany({ where: { childId: child.id } }),
    db.dailyStreak.findUnique({ where: { childId: child.id } }),
    db.dailyUsage.findMany({ where: { childId: child.id }, orderBy: { day: "desc" }, take: 60 }),
  ]);
  const completions: Completion[] = attempts.map((a) => ({
    id: a.id, childId: a.childId, activityId: a.activityId, track: a.track as Track, subject: a.subjectId as SubjectId,
    title: a.title, icon: a.icon, day: a.day, completedAt: a.completedAt.toISOString(), correct: a.correct, total: a.total,
    scorePct: a.scorePct, stars: a.stars, xp: a.xp, seconds: a.seconds, repeat: a.repeat,
  }));
  return {
    child,
    completions,
    badges: badges.map((b) => ({ badgeId: b.badgeId, unlockedAt: b.unlockedAt.toISOString() })),
    streak: streak ? { current: streak.current, longest: streak.longest, lastDay: streak.lastDay } : { current: 0, longest: 0, lastDay: null },
    usage: Object.fromEntries(usage.map((u) => [u.day, u.seconds])),
  };
}

/**
 * Runs the engine and persists everything it produced in ONE transaction:
 * attempt + answers, XP & star events, streak, badges, mastery snapshot,
 * achievements and (per parent settings) notifications.
 */
export async function recordCompletion(args: {
  progress: ChildProgress; activity: Activity; input: CompletionInput; content: ContentStore; today: string;
  notify: { activity: boolean; badge: boolean; goal: boolean };
}): Promise<CompletionResult> {
  const { progress, activity, input, content, today, notify } = args;
  const out = completeActivity(progress, activity, input, { now: new Date(), today, badges: content.badges, newId: () => crypto.randomUUID() });
  const r = out.result;
  const c = r.completion;
  const childId = progress.child.id;
  const m = mastery(out.progress.completions)[activity.track];
  const lvl = decideLevel(progress.child, activity.track, out.progress.completions, "9999-12-31", content.ageGroups).level;

  await db.$transaction(async (tx) => {
    const attempt = await tx.quizAttempt.create({
      data: {
        id: c.id, childId, activityId: c.activityId, track: c.track, subjectId: c.subject, title: c.title, icon: c.icon, day: c.day,
        correct: c.correct, total: c.total, scorePct: c.scorePct, stars: c.stars, xp: c.xp, seconds: c.seconds, repeat: c.repeat, completedAt: new Date(c.completedAt),
        answers: input.kind === "quiz" && r.score ? {
          create: r.score.results.map((res) => ({ questionId: res.questionId, correct: res.correct, response: (input.responses[res.questionId] ?? null) as never })),
        } : undefined,
      },
    });
    await tx.xpEvent.create({ data: { childId, amount: r.xpAwarded, reason: c.repeat ? "practice" : `activity:${c.track}`, attemptId: attempt.id } });
    await tx.starEvent.create({ data: { childId, amount: r.stars, attemptId: attempt.id } });
    await tx.dailyStreak.upsert({
      where: { childId },
      create: { childId, current: r.streak.current, longest: r.streak.longest, lastDay: r.streak.lastDay },
      update: { current: r.streak.current, longest: r.streak.longest, lastDay: r.streak.lastDay },
    });
    if (r.newBadges.length) {
      await tx.childBadge.createMany({ data: r.newBadges.map((b) => ({ childId, badgeId: b.id })), skipDuplicates: true });
    }
    await tx.progress.upsert({
      where: { childId_track: { childId, track: activity.track } },
      create: { childId, track: activity.track, mastery: m, level: lvl, completed: 1 },
      update: { mastery: m, level: lvl, completed: { increment: c.repeat ? 0 : 1 } },
    });
    if (r.goalReachedNow) await tx.achievement.create({ data: { childId, kind: "GOAL_MET", day: today, detail: `Reached daily goal of ${r.summary.goal}` } });
    if (c.scorePct === 100 && !c.repeat) await tx.achievement.create({ data: { childId, kind: "PERFECT_SCORE", day: today, detail: c.title } });
    if (r.streakChanged === "extended" && [3, 7, 14, 30].includes(r.streak.current)) {
      await tx.achievement.create({ data: { childId, kind: "STREAK_MILESTONE", day: today, detail: `${r.streak.current}-day streak` } });
    }
    const allowed = out.notifications.filter((n: PendingNotification) => n.kind === "safety" || notify[n.kind]);
    if (allowed.length) {
      await tx.notification.createMany({ data: allowed.map((n) => ({ parentId: progress.child.parentId, childId, kind: n.kind, text: n.text })) });
      // ▶ PRODUCTION: enqueue email/push delivery here (e.g. a job queue worker).
    }
  });
  return r;
}
