import type { ChildProgress, ChildSummary, Completion, Track } from "../types";
import { SCORED_TRACKS } from "../types";
import { TRACK_META } from "../content/meta";
import { addDays } from "./util";
import { visibleStreak } from "./rewards";

export function summarize(p: ChildProgress, today: string): ChildSummary {
  const todayIds = new Set(p.completions.filter((c) => c.day === today).map((c) => c.activityId));
  return {
    xp: p.completions.reduce((s, c) => s + c.xp, 0),
    stars: p.completions.reduce((s, c) => s + c.stars, 0),
    streak: { ...p.streak, current: visibleStreak(p.streak, today) },
    badges: p.badges.length,
    activitiesCompleted: p.completions.filter((c) => !c.repeat).length,
    todayDone: todayIds.size,
    goal: p.child.settings.dailyGoal,
  };
}

/**
 * Mastery per scored track: recency-weighted average of the last 8 quiz
 * scores (newest counts most). null when there is no data yet.
 */
export function mastery(completions: Completion[]): Record<Track, number | null> {
  const out = {} as Record<Track, number | null>;
  for (const t of SCORED_TRACKS) {
    const scores = completions
      .filter((c) => c.track === t && c.scorePct !== null)
      .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
      .slice(0, 8)
      .map((c) => c.scorePct as number);
    if (!scores.length) { out[t] = null; continue; }
    let wsum = 0, sum = 0;
    scores.forEach((s, i) => { const w = 8 - i; wsum += w; sum += s * w; });
    out[t] = Math.round(sum / wsum);
  }
  out.creativity = null;
  out.habit = null;
  return out;
}

export interface DayStat { day: string; activities: number; minutes: number; xp: number; }

export function lastNDays(p: ChildProgress, today: string, n: number): DayStat[] {
  const days = Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
  return days.map((day) => {
    const cs = p.completions.filter((c) => c.day === day);
    const usageMin = Math.round((p.usage[day] ?? 0) / 60);
    const activityMin = Math.round(cs.reduce((s, c) => s + c.seconds, 0) / 60);
    return { day, activities: new Set(cs.map((c) => c.activityId)).size, minutes: Math.max(usageMin, activityMin), xp: cs.reduce((s, c) => s + c.xp, 0) };
  });
}

export function scoreTrend(p: ChildProgress, track: Track, today: string, days = 14): (number | null)[] {
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    const cs = p.completions.filter((c) => c.track === track && c.day === day && c.scorePct !== null);
    return cs.length ? Math.round(cs.reduce((s, c) => s + (c.scorePct ?? 0), 0) / cs.length) : null;
  });
}

export interface Recommendation { icon: string; title: string; body: string; track?: Track; }

/** Friendly, per-child recommendations for the parent dashboard. */
export function recommendations(p: ChildProgress, today: string): Recommendation[] {
  const m = mastery(p.completions);
  const scored = SCORED_TRACKS.filter((t) => m[t] !== null && p.child.settings.allowedTracks.includes(t));
  const recs: Recommendation[] = [];
  const name = p.child.name;
  if (!p.completions.length) {
    return [{ icon: "🚀", title: "Start the first adventure", body: `Hand the device to ${name} and open Today's Adventure — it takes about 5 minutes per activity.` }];
  }
  if (scored.length) {
    const best = scored.reduce((a, b) => ((m[a] ?? 0) >= (m[b] ?? 0) ? a : b));
    const weak = scored.reduce((a, b) => ((m[a] ?? 0) <= (m[b] ?? 0) ? a : b));
    if ((m[best] ?? 0) >= 70) {
      recs.push({ icon: "🌟", title: `${TRACK_META[best].progressLabel} is a strength`, body: `${name} is scoring around ${m[best]}% here. Ask them to teach you something they learned!`, track: best });
    }
    if ((m[weak] ?? 100) < 70 && (weak !== best || (m[best] ?? 0) < 70)) {
      recs.push({ icon: "🤝", title: `Practise ${TRACK_META[weak].progressLabel} together`, body: `Scores are around ${m[weak]}%. Difficulty adjusts automatically after a few tries, and a few minutes of shared practice helps a lot.`, track: weak });
    }
  }
  const week = lastNDays(p, today, 7);
  const activeDays = week.filter((d) => d.activities > 0).length;
  recs.push(activeDays >= 5
    ? { icon: "🔥", title: "Great routine", body: `${name} learned on ${activeDays} of the last 7 days. Consistency beats long sessions.` }
    : { icon: "🗓️", title: "Try a daily learning moment", body: `${name} learned on ${activeDays} of the last 7 days. A regular time (like after breakfast) helps build the habit.` });
  const creative = p.completions.filter((c) => c.track === "creativity" && c.day >= addDays(today, -6)).length;
  if (creative === 0 && p.child.settings.allowedTracks.includes("creativity")) {
    recs.push({ icon: "🎨", title: "Make time to create", body: "No creative activities this week. Drawing and making things builds imagination and fine motor skills." });
  }
  return recs.slice(0, 3);
}
