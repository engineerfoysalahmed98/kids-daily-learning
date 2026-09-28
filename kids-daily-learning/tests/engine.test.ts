import { describe, expect, it } from "vitest";
// Runs under vitest (npm test) and bun test.
import { defaultContent } from "../src/core/content";
import {
  addDays, advanceStreak, buildDailyPlan, checkAnswer, completeActivity, computeStats, decideLevel,
  mastery, resolveActivity, scoreAttempt, visibleStreak,
} from "../src/core/engine";
import { checkChildMessage } from "../src/core/buddy/safety";
import { mockBuddyReply } from "../src/core/buddy/mockBuddy";
import type { Child, ChildProgress, Question, Response } from "../src/core/types";
import { ALL_TRACKS } from "../src/core/types";

const content = defaultContent();
const TODAY = "2026-09-24";

function makeChild(age: number, over: Partial<Child> = {}): Child {
  return {
    id: "child-1", parentId: "parent-1", name: "Ayaan", age, avatar: "🦁",
    createdAt: `${TODAY}T01:00:00.000Z`,
    settings: { dailyGoal: 5, screenTimeMinutes: 45, allowedTracks: [...ALL_TRACKS], aiEnabled: true, soundOn: true, largeText: false },
    ...over,
  };
}

function correctResponse(q: Question): Response {
  switch (q.type) {
    case "mc": return { type: "mc", choice: q.answer };
    case "image": return { type: "image", choice: q.answer };
    case "tf": return { type: "tf", value: q.answer };
    case "type": return { type: "type", text: q.accept[0] };
    case "order": return { type: "order", items: q.items };
    case "match": return { type: "match", pairs: Object.fromEntries(q.pairs) };
  }
}

describe("daily plan", () => {
  it("builds the sample program for a 7-year-old on day one", () => {
    const child = makeChild(7);
    const plan = buildDailyPlan({ child, history: [], content, timeZone: "UTC" }, TODAY);
    expect(plan.map((a) => a.title)).toEqual([
      "Learn 5 New Words", "Addition Challenge", "Amazing Animals", "The Little Explorer",
      "Pattern Puzzle", "Draw Your Dream House", "Organize Your Study Table",
    ]);
  });

  it("is deterministic and rebuildable from the activity id", () => {
    const ctx = { child: makeChild(8), history: [], content, timeZone: "UTC" };
    const plan = buildDailyPlan(ctx, TODAY);
    for (const a of plan) expect(resolveActivity(ctx, a.id)).toEqual(a);
  });

  it("scales difficulty with age", () => {
    const math = (age: number) => buildDailyPlan({ child: makeChild(age), history: [], content, timeZone: "UTC" }, TODAY).find((a) => a.track === "math")!;
    expect(math(5).difficulty).toBe(1);
    expect(math(8).difficulty).toBe(3);
    expect(math(11).difficulty).toBe(5);
    expect(math(11).title).toBe("Fraction Quest");
  });

  it("respects parent-disabled tracks", () => {
    const child = makeChild(7, { settings: { ...makeChild(7).settings, allowedTracks: ["math", "story", "habit", "english", "brain"] } });
    const plan = buildDailyPlan({ child, history: [], content, timeZone: "UTC" }, TODAY);
    expect(plan.map((a) => a.track)).toEqual(["english", "math", "story", "brain", "habit"]);
  });

  it("generates valid questions for every level", () => {
    for (const age of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      for (let d = 0; d < 6; d++) {
        const plan = buildDailyPlan({ child: makeChild(age), history: [], content, timeZone: "UTC" }, addDays(TODAY, d));
        for (const a of plan) {
          for (const q of a.questions ?? []) {
            expect(checkAnswer(q, correctResponse(q))).toBe(true);
            if (q.type === "mc" || q.type === "image") {
              expect(q.answer).toBeGreaterThanOrEqual(0);
              expect(new Set(q.options.map((o) => (typeof o === "string" ? o : o.emoji + o.label))).size).toBe(q.options.length);
            }
            if (q.type === "match") expect(new Set(q.pairs.map((p) => p[1])).size).toBe(q.pairs.length);
          }
        }
      }
    }
  });
});

describe("adaptive level", () => {
  it("moves up after strong scores and down after low scores", () => {
    const child = makeChild(7);
    const mk = (pct: number, i: number) => ({ id: `c${i}`, childId: child.id, activityId: `x${i}`, track: "math" as const, subject: "math" as const, title: "", icon: "", day: addDays(TODAY, -i - 1), completedAt: new Date(Date.UTC(2026, 8, 20 - i)).toISOString(), correct: 0, total: 6, scorePct: pct, stars: 3, xp: 10, seconds: 60, repeat: false });
    expect(decideLevel(child, "math", [95, 100, 90].map(mk), TODAY, content.ageGroups).level).toBe(3);
    expect(decideLevel(child, "math", [30, 40, 20].map(mk), TODAY, content.ageGroups).level).toBe(1);
    expect(decideLevel(child, "math", [70, 60, 80].map(mk), TODAY, content.ageGroups).level).toBe(2);
  });
});

describe("scoring", () => {
  it("accepts typed answers loosely", () => {
    const q: Question = { id: "q", type: "type", prompt: "", accept: ["Curious"], inputMode: "text", explain: "" };
    expect(checkAnswer(q, { type: "type", text: "  curious. " })).toBe(true);
    expect(checkAnswer(q, { type: "type", text: "curios" })).toBe(false);
    expect(checkAnswer(q, { type: "mc", choice: 0 })).toBe(false);
  });
  it("computes percentage", () => {
    const qs: Question[] = [
      { id: "a", type: "tf", prompt: "", answer: true, explain: "" },
      { id: "b", type: "tf", prompt: "", answer: false, explain: "" },
    ];
    expect(scoreAttempt(qs, { a: { type: "tf", value: true }, b: { type: "tf", value: true } }).pct).toBe(50);
  });
});

describe("streaks", () => {
  it("extends, holds and restarts gently", () => {
    let s = { current: 0, longest: 0, lastDay: null as string | null };
    s = advanceStreak(s, "2026-09-20").streak;
    s = advanceStreak(s, "2026-09-21").streak;
    expect(s.current).toBe(2);
    expect(advanceStreak(s, "2026-09-21").change).toBe("same");
    const r = advanceStreak(s, "2026-09-24");
    expect(r.change).toBe("restarted");
    expect(r.streak.current).toBe(1);
    expect(r.streak.longest).toBe(2);
    expect(visibleStreak(s, "2026-09-22")).toBe(2);
    expect(visibleStreak(s, "2026-09-23")).toBe(0);
  });
});

describe("complete activity → XP, badges, notifications", () => {
  it("runs the main flow for a new child", () => {
    const child = makeChild(7);
    const ctx = { child, history: [], content, timeZone: "UTC" };
    const plan = buildDailyPlan(ctx, TODAY);
    let progress: ChildProgress = { child, completions: [], badges: [], streak: { current: 0, longest: 0, lastDay: null }, usage: {} };
    const math = plan.find((a) => a.track === "math")!;
    const responses = Object.fromEntries(math.questions!.map((q) => [q.id, correctResponse(q)]));
    let n = 0;
    const opts = { now: new Date(`${TODAY}T08:00:00Z`), today: TODAY, badges: content.badges, newId: () => `id${n++}` };
    const r = completeActivity(progress, math, { kind: "quiz", responses, seconds: 120 }, opts);
    expect(r.result.score?.pct).toBe(100);
    expect(r.result.xpAwarded).toBe(10 + 6 * 2 + 5);
    expect(r.result.stars).toBe(3);
    expect(r.result.streak.current).toBe(1);
    expect(r.result.newBadges.map((b) => b.id).sort()).toEqual(["first-activity", "perfect-score"]);
    expect(r.notifications.map((x) => x.kind)).toEqual(["activity", "badge", "badge"]);
    progress = r.progress;

    // Repeat gives only practice XP
    const again = completeActivity(progress, math, { kind: "quiz", responses, seconds: 60 }, opts);
    expect(again.result.xpAwarded).toBe(3);
    expect(again.result.completion.repeat).toBe(true);

    // Rejects wrong completion kind
    expect(() => completeActivity(progress, math, { kind: "done", seconds: 1 }, opts)).toThrow();

    // Mastery reflects score
    expect(mastery(progress.completions).math).toBe(100);
    expect(computeStats(progress).activities).toBe(1);
  });
});

describe("buddy", () => {
  it("blocks personal info, secrets and unsafe topics", () => {
    expect(checkChildMessage("my address is 12 Oak Street").ok).toBe(false);
    expect(checkChildMessage("don't tell my mom").ok).toBe(false);
    expect(checkChildMessage("how do I use a knife").ok).toBe(false);
    expect(checkChildMessage("why is blood red?").ok).toBe(true);
    expect(checkChildMessage("What is 5 + 3?").ok).toBe(true);
  });
  it("teaches arithmetic by counting", () => {
    const r = mockBuddyReply("What is 5 + 3?", { name: "Ayaan", age: 7, vocab: content.vocab });
    expect(r.text).toContain("5... 6... 7... 8");
    expect(r.text).toContain("The answer is 8");
  });
});
