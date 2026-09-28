/**
 * MOCK DATA — development/demo only. Never imported by server code.
 * Builds realistic history by *playing* past days through the real engine,
 * so XP, streaks, badges and charts are all internally consistent.
 */
import type { Child, ChildProgress, ContentStore, ParentNotification, Question, Response, Track } from "@/core/types";
import { ALL_TRACKS } from "@/core/types";
import { addDays, buildDailyPlan, completeActivity, createRng, dayKey } from "@/core/engine";

export interface MockParentRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  pinHash: string | null;
  createdAt: string;
  notifications: { activity: boolean; badge: boolean; goal: boolean };
  role: "PARENT" | "ADMIN";
}

export interface MockDB {
  version: 1;
  parents: MockParentRecord[];
  children: Child[];
  progress: Record<string, Omit<ChildProgress, "child">>;
  notifications: ParentNotification[];
  content: ContentStore;
  session: { parentId: string | null; childId: string | null; mode: "parent" | "child" | null };
  buddyLog: Record<string, number[]>; // childId -> timestamps (rate limiting)
}

export const DEMO_LOGIN = { email: "demo@kidsdaily.app", password: "learn2day" };

function wrongResponse(q: Question): Response {
  switch (q.type) {
    case "mc": return { type: "mc", choice: (q.answer + 1) % q.options.length };
    case "image": return { type: "image", choice: (q.answer + 1) % q.options.length };
    case "tf": return { type: "tf", value: !q.answer };
    case "type": return { type: "type", text: "?" };
    case "order": return { type: "order", items: [...q.items].reverse() };
    case "match": return { type: "match", pairs: Object.fromEntries(q.pairs.map(([l], i) => [l, q.pairs[(i + 1) % q.pairs.length][1]])) };
  }
}

function rightResponse(q: Question): Response {
  switch (q.type) {
    case "mc": return { type: "mc", choice: q.answer };
    case "image": return { type: "image", choice: q.answer };
    case "tf": return { type: "tf", value: q.answer };
    case "type": return { type: "type", text: q.accept[0] };
    case "order": return { type: "order", items: q.items };
    case "match": return { type: "match", pairs: Object.fromEntries(q.pairs) };
  }
}

interface SimProfile {
  child: Child;
  skill: Partial<Record<Track, number>>;
  /** day offsets (negative) with activity; others skipped */
  activeDays: number[];
  perDay: [number, number];
}

function simulate(p: SimProfile, content: ContentStore, today: string, newId: () => string): { progress: ChildProgress; notes: { text: string; kind: ParentNotification["kind"]; at: string }[] } {
  let progress: ChildProgress = { child: p.child, completions: [], badges: [], streak: { current: 0, longest: 0, lastDay: null }, usage: {} };
  const notes: { text: string; kind: ParentNotification["kind"]; at: string }[] = [];
  const rng = createRng(`sim|${p.child.id}`);
  for (const offset of p.activeDays) {
    const day = addDays(today, offset);
    const plan = buildDailyPlan({ child: p.child, history: progress.completions, content }, day);
    const count = rng.int(p.perDay[0], Math.min(p.perDay[1], plan.length));
    const chosen = plan.slice(0, count);
    let minute = 0;
    for (const a of chosen) {
      const now = new Date(`${day}T16:${String(10 + minute).padStart(2, "0")}:00`);
      minute += 6;
      const seconds = 150 + rng.int(0, 240);
      const skill = p.skill[a.track] ?? 0.8;
      let input;
      if (a.kind === "creative" || a.kind === "habit") input = { kind: "done" as const, seconds };
      else input = { kind: "quiz" as const, seconds, responses: Object.fromEntries((a.questions ?? []).map((q) => [q.id, rng.next() < skill ? rightResponse(q) : wrongResponse(q)])) };
      const r = completeActivity(progress, a, input, { now, today: day, badges: content.badges, newId });
      progress = r.progress;
      for (const n of r.notifications) notes.push({ ...n, at: now.toISOString() });
    }
    progress.usage[day] = chosen.length * 330 + rng.int(60, 300);
  }
  return { progress, notes };
}

export function createSeed(content: ContentStore, demoPasswordHash: string, now = new Date()): MockDB {
  const today = dayKey(now);
  let n = 0;
  const newId = () => `seed-${(n++).toString(36)}`;
  const parentId = "parent-demo";
  const created = (daysAgo: number) => new Date(`${addDays(today, -daysAgo)}T09:00:00`).toISOString();
  const settings = (age: number) => ({ dailyGoal: 5, screenTimeMinutes: age < 8 ? 45 : 60, allowedTracks: [...ALL_TRACKS], aiEnabled: true, soundOn: true, largeText: false });

  const ayaan: Child = { id: "child-ayaan", parentId, name: "Ayaan", age: 7, avatar: "🦁", createdAt: created(13), settings: settings(7) };
  const maya: Child = { id: "child-maya", parentId, name: "Maya", age: 10, avatar: "🦊", createdAt: created(16), settings: settings(10) };

  // Ayaan: a gap 7 days ago, then 6 days in a row → finishing one activity today makes a 7-day streak.
  const ayaanSim = simulate({
    child: ayaan, perDay: [3, 6],
    skill: { english: 0.8, math: 0.7, science: 0.88, gk: 0.8, story: 0.82, brain: 0.75 },
    activeDays: [-13, -12, -11, -10, -9, -8, -6, -5, -4, -3, -2, -1],
  }, content, today, newId);
  const mayaSim = simulate({
    child: maya, perDay: [4, 7],
    skill: { english: 0.9, math: 0.78, science: 0.85, gk: 0.9, story: 0.92, brain: 0.8 },
    activeDays: [-16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1],
  }, content, today, newId);

  const notifications: ParentNotification[] = [...ayaanSim.notes.map((x) => ({ ...x, childId: ayaan.id })), ...mayaSim.notes.map((x) => ({ ...x, childId: maya.id }))]
    .filter((x) => x.at >= new Date(`${addDays(today, -2)}T00:00:00`).toISOString())
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 14)
    .map((x) => ({ id: newId(), parentId, childId: x.childId, kind: x.kind, text: x.text, createdAt: x.at, read: x.at < new Date(`${addDays(today, -1)}T00:00:00`).toISOString() }));

  const strip = (p: ChildProgress) => ({ completions: p.completions, badges: p.badges, streak: p.streak, usage: p.usage });

  return {
    version: 1,
    parents: [{
      id: parentId, email: DEMO_LOGIN.email, displayName: "Sam", passwordHash: demoPasswordHash, pinHash: null,
      createdAt: created(16), notifications: { activity: true, badge: true, goal: true }, role: "ADMIN",
    }],
    children: [ayaan, maya],
    progress: { [ayaan.id]: strip(ayaanSim.progress), [maya.id]: strip(mayaSim.progress) },
    notifications,
    content,
    session: { parentId: null, childId: null, mode: null },
    buddyLog: {},
  };
}
