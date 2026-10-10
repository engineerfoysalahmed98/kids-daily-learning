import { describe, expect, it } from "vitest";
// Runs under vitest (npm test) and bun test.
import {
  AGE_PATHS, BN_BADGES, BN_LEVELS, BN_TOPICS, buildBnQuiz, compute, emptyProgress, enName, equationText, fromBn, bnName,
  makeProblem, markGroupSeen, markLessonSeen, NUMBER_GROUPS, NUMBERS, numbersInGroup, OP_IDS, OP_LESSONS, orderedTopics,
  parseProgress, parseQuizId, possessive, quizId, recordQuiz, repeatedAddition, setAgeGroup, storySentence, suggestedLevel,
  timesTable, toBn, type BnLevel, type OpId,
} from "../src/core/bangla";
import { checkAnswer, createRng } from "../src/core/engine";
import type { Question, Response } from "../src/core/types";

const BN_DIGIT = /^[০-৯]+$/;

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

function correctText(q: Question): string {
  if (q.type === "mc") return q.options[q.answer];
  if (q.type === "type") return q.accept[0];
  throw new Error(`unexpected question type ${q.type}`);
}

const ALL_QUIZ_IDS = [
  ...BN_TOPICS.flatMap((t) => BN_LEVELS.map((l) => quizId({ topic: t, level: l }))),
  ...NUMBER_GROUPS.map((g) => quizId({ topic: "numbers", level: 1, group: g.id })),
];

describe("Bangla numbers ১–১০০", () => {
  it("converts numerals both ways", () => {
    expect(toBn(0)).toBe("০");
    expect(toBn(27)).toBe("২৭");
    expect(toBn(100)).toBe("১০০");
    expect(toBn("৩ + 4")).toBe("৩ + ৪");
    for (let n = 0; n <= 1000; n++) expect(fromBn(toBn(n))).toBe(n);
    expect(fromBn("45")).toBe(45);
    expect(Number.isNaN(fromBn("৪x"))).toBe(true);
  });

  it("has a unique Bangla and English name for every number", () => {
    expect(NUMBERS).toHaveLength(100);
    expect(new Set(NUMBERS.map((x) => x.bnName)).size).toBe(100);
    expect(new Set(NUMBERS.map((x) => x.enName)).size).toBe(100);
    for (const x of NUMBERS) {
      expect(x.bn).toBe(toBn(x.n));
      expect(x.bnName.length > 0).toBe(true);
      expect(/^[ঀ-৿]+$/.test(x.bnName)).toBe(true);
    }
  });

  it("uses the expected spellings", () => {
    const spot: [number, string][] = [[1, "এক"], [5, "পাঁচ"], [10, "দশ"], [11, "এগারো"], [14, "চৌদ্দ"], [19, "উনিশ"], [20, "বিশ"],
      [27, "সাতাশ"], [29, "ঊনত্রিশ"], [37, "সাঁইত্রিশ"], [45, "পঁয়তাল্লিশ"], [50, "পঞ্চাশ"], [53, "তিপ্পান্ন"], [66, "ছেষট্টি"],
      [73, "তিয়াত্তর"], [88, "অষ্টাশি"], [99, "নিরানব্বই"], [100, "একশো"]];
    for (const [n, name] of spot) expect(bnName(n)).toBe(name);
    expect(enName(7)).toBe("seven");
    expect(enName(13)).toBe("thirteen");
    expect(enName(40)).toBe("forty");
    expect(enName(99)).toBe("ninety-nine");
    expect(enName(100)).toBe("one hundred");
  });

  it("splits 1–100 into ten groups of ten", () => {
    expect(NUMBER_GROUPS).toHaveLength(10);
    const all = NUMBER_GROUPS.flatMap((g) => numbersInGroup(g.id).map((x) => x.n));
    expect(all).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(NUMBER_GROUPS[0].title).toBe("১ থেকে ১০");
  });
});

describe("Bangla operation lessons", () => {
  it("shows the requested examples correctly", () => {
    expect(equationText("add", 2, 3)).toBe("২ + ৩ = ৫");
    expect(equationText("sub", 5, 2)).toBe("৫ − ২ = ৩");
    expect(equationText("mul", 3, 2)).toBe("৩ × ২ = ৬");
    expect(equationText("div", 6, 2)).toBe("৬ ÷ ২ = ৩");
    expect(repeatedAddition(3, 2)).toBe("২ + ২ + ২ = ৬");
    expect(storySentence("div", 6, 2, { emoji: "🥭", name: "আম" })).toBe("৬টি আম ২ জন শিশুর মধ্যে সমানভাবে ভাগ করলে প্রত্যেকে ৩টি করে পাবে।");
  });

  it("worked examples are whole-number and correct", () => {
    for (const op of OP_IDS) {
      for (const ex of OP_LESSONS[op].examples) {
        const r = compute(op, ex.a, ex.b);
        expect(Number.isInteger(r) && r >= 0).toBe(true);
      }
    }
  });

  it("builds correct নামতা", () => {
    for (let n = 2; n <= 10; n++) for (const row of timesTable(n)) expect(row.product).toBe(row.a * row.b);
    expect(timesTable(3)[1].text).toBe("৩ × ২ = ৬");
  });

  it("uses natural Bangla possessives", () => {
    expect(possessive("রিনা")).toBe("রিনার");
    expect(possessive("সুমন")).toBe("সুমনের");
    expect(possessive("মিতু")).toBe("মিতুর");
  });
});

describe("Bangla quizzes are mathematically correct", () => {
  it("random problems stay in range for every level", () => {
    const rng = createRng("problems");
    for (const op of OP_IDS) for (const level of BN_LEVELS) for (let i = 0; i < 2000; i++) {
      const p = makeProblem(op, level as BnLevel, rng);
      expect(p.result).toBe(compute(op, p.a, p.b));
      expect(Number.isInteger(p.result)).toBe(true);
      expect(p.result >= (op === "div" ? 1 : 0)).toBe(true);
      expect(p.a >= 1 && p.b >= 1).toBe(true);
      if (op === "add" && level === 1) expect(p.result <= 5).toBe(true);
      if (op === "add" && level === 2) expect(p.result <= 10).toBe(true);
      if (op === "sub" && level === 1) expect(p.a <= 5).toBe(true);
      if (op === "sub") expect(p.b < p.a).toBe(true);
      if (op === "mul" && level === 1) expect(p.result <= 9).toBe(true);
      if (op === "div") expect(p.a % p.b).toBe(0);
      if (op === "div" && level === 1) expect(p.b).toBe(2);
      expect(p.result <= 100).toBe(true);
    }
  });

  it("every generated question is well-formed and its marked answer is right", () => {
    let checked = 0;
    for (const id of ALL_QUIZ_IDS) {
      for (let seed = 0; seed < 150; seed++) {
        const quiz = buildBnQuiz(id, seed)!;
        expect(quiz).toBeTruthy();
        const qs = quiz.questions!;
        const spec = parseQuizId(id)!;
        expect(qs.length).toBe(spec.level === 1 ? 5 : 6);
        expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
        for (const q of qs) {
          checked++;
          expect(checkAnswer(q, correctResponse(q))).toBe(true);
          if (q.type === "mc") {
            expect(q.options.length >= 2).toBe(true);
            expect(new Set(q.options).size).toBe(q.options.length);
            expect(q.answer >= 0 && q.answer < q.options.length).toBe(true);
          }
          expect(q.explain.length > 0).toBe(true);
          expect(/[ঀ-৿]/.test(q.prompt)).toBe(true); // Bangla instructions

          const parts = q.id.split(".");
          if (parts[0] === "bnm") {
            // bnm.<op>.<a>.<b>.<variant> — recompute independently
            const [, op, aS, bS, variant] = parts;
            const a = Number(aS), b = Number(bS);
            const expected = variant === "miss" ? b : compute(op as OpId, a, b);
            const shown = correctText(q);
            expect(fromBn(shown)).toBe(expected);
            if (q.type === "mc") {
              expect(BN_DIGIT.test(shown)).toBe(true);
              // no distractor is secretly also correct
              expect(q.options.filter((o) => fromBn(o) === expected)).toHaveLength(1);
            }
            if (q.type === "type") expect(q.accept).toContain(String(expected));
          } else {
            // bnn.<kind>.<n...>
            const [, kind, nS] = parts;
            const shown = correctText(q);
            if (kind === "bigger") expect(fromBn(shown)).toBe(Math.max(...nS.split("-").map(Number)));
            else {
              const n = Number(nS);
              if (kind === "count" || kind === "read") expect(shown).toBe(toBn(n));
              if (kind === "name") expect(shown).toBe(bnName(n));
              if (kind === "en") expect(shown).toBe(String(n));
              if (kind === "next") expect(shown).toBe(toBn(n + 1));
              if (kind === "prev") expect(shown).toBe(toBn(n - 1));
              if (spec.group) {
                const g = NUMBER_GROUPS[spec.group - 1];
                expect(n >= g.from && n <= g.to).toBe(true);
              }
            }
          }
        }
      }
    }
    expect(checked > 10000).toBe(true);
  });

  it("counting pictures show exactly the right number of objects", () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const q of buildBnQuiz("numbers-1", seed)!.questions!) {
        if (!q.id.startsWith("bnn.count.") || !q.visual) continue;
        const n = Number(q.id.split(".")[2]);
        const glyphs = Array.from(new Intl.Segmenter().segment(q.visual.replace(/\s/g, ""))).length;
        expect(glyphs).toBe(n);
      }
    }
  });

  it("rejects unknown quiz ids", () => {
    expect(buildBnQuiz("add-4", 1)).toBe(null);
    expect(buildBnQuiz("numbers-g11", 1)).toBe(null);
    expect(buildBnQuiz("../../etc", 1)).toBe(null);
  });
});

describe("age-based learning paths", () => {
  it("matches the requested focus for each age", () => {
    const byId = Object.fromEntries(AGE_PATHS.map((p) => [p.id, p]));
    expect(byId["3-4"].focus).toEqual(["numbers"]);
    expect(byId["5-6"].focus).toContain("add");
    expect(byId["5-6"].focus).toContain("sub");
    expect(byId["7-8"].focus.slice(0, 2)).toEqual(["mul", "div"]);
    expect(suggestedLevel("3-4", "numbers")).toBe(1);
    expect(suggestedLevel("7-8", "add")).toBe(3);
    expect(suggestedLevel(null, "mul")).toBe(1);
  });

  it("keeps every topic open (paths are suggestions, not limits)", () => {
    for (const p of [...AGE_PATHS.map((x) => x.id), null] as const) {
      const topics = orderedTopics(p).map((t) => t.topic);
      expect([...topics].sort()).toEqual([...BN_TOPICS].sort());
    }
    expect(orderedTopics("7-8")[0]).toEqual({ topic: "mul", recommended: true });
  });
});

describe("guest stars and badges", () => {
  const NOW = "2026-10-09T10:00:00.000Z";
  const quiz = buildBnQuiz("add-1", "fixed")!;
  const qs = quiz.questions!;
  const allRight = Object.fromEntries(qs.map((q) => [q.id, correctResponse(q)]));

  it("awards one star per correct answer", () => {
    const out = recordQuiz(emptyProgress(), "add-1", qs, allRight, NOW);
    expect(out.correct).toBe(qs.length);
    expect(out.starsEarned).toBe(qs.length);
    expect(out.progress.stars).toBe(qs.length);
    expect(out.passed).toBe(true);
    const ids = out.newBadges.map((b) => b.id);
    expect(ids).toContain("bn-first-star");
    expect(ids).toContain("bn-add-1");
  });

  it("never awards duplicate stars or badges for the same answers", () => {
    const first = recordQuiz(emptyProgress(), "add-1", qs, allRight, NOW);
    const again = recordQuiz(first.progress, "add-1", qs, allRight, NOW);
    expect(again.starsEarned).toBe(0);
    expect(again.alreadyRewarded).toBe(qs.length);
    expect(again.progress.stars).toBe(first.progress.stars);
    expect(again.newBadges).toHaveLength(0);
    expect(again.progress.quizzes["add-1"].attempts).toBe(2);
  });

  it("gives no stars for wrong answers and does not shame", () => {
    const wrong: Record<string, Response> = {};
    for (const q of qs) if (q.type === "mc") wrong[q.id] = { type: "mc", choice: (q.answer + 1) % q.options.length };
    const out = recordQuiz(emptyProgress(), "add-1", qs, wrong, NOW);
    expect(out.starsEarned).toBe(0);
    expect(out.passed).toBe(false);
    expect(out.progress.quizzes["add-1"].bestPct).toBe(0);
  });

  it("keeps the best score", () => {
    const good = recordQuiz(emptyProgress(), "add-1", qs, allRight, NOW);
    const bad = recordQuiz(good.progress, "add-1", qs, {}, NOW);
    expect(bad.progress.quizzes["add-1"].bestPct).toBe(100);
    expect(bad.progress.quizzes["add-1"].lastPct).toBe(0);
  });

  it("unlocks the explorer badge after all ten number groups, once", () => {
    let p = emptyProgress();
    const earned: string[] = [];
    for (const g of [...NUMBER_GROUPS, NUMBER_GROUPS[0]]) {
      const r = markGroupSeen(p, g.id, NOW);
      p = r.progress;
      earned.push(...r.newBadges.map((b) => b.id));
    }
    expect(earned).toEqual(["bn-explorer"]);
    let q = emptyProgress();
    for (const op of OP_IDS) q = markLessonSeen(q, op, NOW).progress;
    expect(q.badges.map((b) => b.id)).toEqual(["bn-all-lessons"]);
  });

  it("saves and restores progress, and survives broken storage", () => {
    const out = recordQuiz(setAgeGroup(emptyProgress(), "5-6"), "add-1", qs, allRight, NOW);
    const restored = parseProgress(JSON.stringify(out.progress));
    expect(restored).toEqual(out.progress);
    expect(parseProgress(null)).toEqual(emptyProgress());
    expect(parseProgress("{not json")).toEqual(emptyProgress());
    expect(parseProgress(JSON.stringify({ version: 1, stars: -5, ageGroup: "9-10", badges: [{ id: "fake" }], quizzes: { "bad-id": { attempts: 1, bestPct: 1, lastPct: 1 } } })))
      .toEqual(emptyProgress());
  });

  it("every badge id is unique", () => {
    expect(new Set(BN_BADGES.map((b) => b.id)).size).toBe(BN_BADGES.length);
  });
});
