import { describe, expect, it } from "vitest";
// Runs under vitest (npm test) and bun test.
import {
  ALL_BN_LETTERS, ALPHABET, AGE_BANDS, BN_SENTENCES, buildHubQuiz, CONSONANTS, countDone, EN_SENTENCES, emptyHubProgress, FOLDERS,
  GENERATED_QUIZ_IDS, HUB_STORIES, isDone, isHubQuizId, markDone, mathCompletion, parseHubProgress, POEMS, recordHubQuiz, awardStar,
  SPELLING_WORDS, VOWELS, findBnLetter, quizBackHref, MATH_PUZZLES, BN_EXTRA_WORDS, BN_LETTER_GUIDE, BN_WORD_GUIDE, EN_WORD_SAY,
  bnLetterGuide, bnWordGuide, enWordSay,
} from "../src/core/hub";
import { checkAnswer } from "../src/core/engine";
import type { Question, Response } from "../src/core/types";

const N = (s: string) => s.normalize("NFC");

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

describe("বাংলা letters", () => {
  it("has all 11 vowels in order", () => {
    expect(VOWELS.map((v) => v.letter).join("")).toBe("অআইঈউঊঋএঐওঔ");
  });

  it("has the 39 consonants, all different", () => {
    expect(CONSONANTS).toHaveLength(39);
    expect(new Set(CONSONANTS.map((c) => N(c.letter))).size).toBe(39);
    expect(N(CONSONANTS.slice(0, 5).map((c) => c.letter).join(""))).toBe(N("কখগঘঙ"));
    expect(N(CONSONANTS.at(-1)!.letter)).toBe(N("ঁ"));
  });

  it("every example word contains its letter, with a picture and a sentence", () => {
    for (const l of ALL_BN_LETTERS) {
      expect(N(l.word).includes(N(l.letter))).toBe(true);
      expect(l.emoji.length > 0).toBe(true);
      expect(/[ঀ-৿]/.test(l.line)).toBe(true);
      expect(/[।!?]$/.test(l.line)).toBe(true);
    }
    expect(findBnLetter("অ")!.word).toBe("অজগর");
    expect(findBnLetter("আ")!.word).toBe("আম");
    expect(findBnLetter("ক")!.word).toBe("কলা");
  });

  it("letters that never start a word say where they sit", () => {
    for (const l of ALL_BN_LETTERS) {
      if (!N(l.word).startsWith(N(l.letter))) expect(!!l.note).toBe(true);
    }
  });

  it("sentences split into the words of the sentence", () => {
    for (const s of BN_SENTENCES) expect(s.words.join(" ") + "।").toBe(s.text);
  });
});

describe("English letters", () => {
  it("covers A–Z with upper and lower case", () => {
    expect(ALPHABET.map((l) => l.upper).join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    for (const l of ALPHABET) {
      expect(l.lower).toBe(l.upper.toLowerCase());
      expect(l.word[0]).toBe(l.upper);
      expect(/[ঀ-৿]/.test(l.bn)).toBe(true);
      expect(/^\/[a-z]+\/$/.test(l.sound)).toBe(true);
    }
  });

  it("spelling words and sentences are clean", () => {
    for (const w of SPELLING_WORDS) expect(/^[a-z]+$/.test(w.word)).toBe(true);
    for (const s of EN_SENTENCES) expect(s.words.join(" ") + ".").toBe(s.text);
  });
});

describe("poems and stories", () => {
  it("poems are grouped by age, have text, a source and questions", () => {
    for (const band of AGE_BANDS) expect(POEMS.filter((p) => p.age === band.id).length >= 3).toBe(true);
    for (const p of POEMS) {
      expect(p.lines.length >= 4).toBe(true);
      expect(["original", "traditional"]).toContain(p.source);
      expect(p.questions.length >= 2).toBe(true);
    }
    expect(new Set(POEMS.map((p) => p.id)).size).toBe(POEMS.length);
  });

  it("has Bangla and English stories at every level", () => {
    for (const lang of ["bn", "en"] as const) expect(HUB_STORIES.filter((s) => s.lang === lang).length >= 5).toBe(true);
    for (const band of AGE_BANDS) expect(HUB_STORIES.some((s) => s.age === band.id)).toBe(true);
    expect(new Set(HUB_STORIES.map((s) => s.id)).size).toBe(HUB_STORIES.length);
    for (const s of HUB_STORIES) expect(s.paragraphs.length >= 3 && s.questions.length >= 2).toBe(true);
  });
});

describe("hub quizzes", () => {
  const allIds = [...GENERATED_QUIZ_IDS, ...POEMS.map((p) => `poem-${p.id}`), ...HUB_STORIES.map((s) => `story-${s.id}`)];

  it("every quiz builds valid questions whose marked answer is right", () => {
    for (const id of allIds) {
      expect(isHubQuizId(id)).toBe(true);
      for (let seed = 0; seed < 60; seed++) {
        const quiz = buildHubQuiz(id, seed)!;
        expect(quiz.questions.length >= 2).toBe(true);
        expect(new Set(quiz.questions.map((q) => q.id)).size).toBe(quiz.questions.length);
        for (const q of quiz.questions) {
          expect(checkAnswer(q, correctResponse(q))).toBe(true);
          if (q.type === "mc" || q.type === "image") {
            expect(q.options.length >= 2).toBe(true);
            const labels = q.type === "mc" ? q.options : q.options.map((o) => o.emoji);
            expect(new Set(labels).size).toBe(labels.length);
            expect(q.answer >= 0 && q.answer < q.options.length).toBe(true);
          }
          if (q.type === "match") expect(new Set(q.pairs.map((p) => p[1])).size).toBe(q.pairs.length);
          if (q.type === "order") expect(new Set(q.items).size).toBe(q.items.length);
        }
      }
    }
  });

  it("missing-letter questions have exactly one real-word answer", () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const q of buildHubQuiz("en-spelling", seed)!.questions) {
        if (!q.id.startsWith("ens.miss.") || q.type !== "mc") continue;
        const [, , word, iS] = q.id.split(".");
        const i = Number(iS);
        expect(q.options[q.answer]).toBe(word[i]);
        const vowel = "aeiou".includes(word[i]);
        for (const o of q.options) if (o !== word[i]) expect("aeiou".includes(o)).toBe(!vowel);
      }
    }
  });

  it("rejects unknown quiz ids", () => {
    expect(buildHubQuiz("nope", 1)).toBe(null);
    expect(buildHubQuiz("poem-nope", 1)).toBe(null);
    expect(isHubQuizId("story-")).toBe(false);
  });
});

describe("hub progress", () => {
  const quiz = buildHubQuiz("bn-chena", "fixed")!;
  const right = Object.fromEntries(quiz.questions.map((q) => [q.id, correctResponse(q)]));

  it("gives one star per correct answer, once", () => {
    const a = recordHubQuiz(emptyHubProgress(), quiz.id, quiz.questions, right);
    expect(a.starsEarned).toBe(quiz.questions.length);
    expect(a.passed).toBe(true);
    expect(isDone(a.progress, "quiz:bn-chena")).toBe(true);
    const b = recordHubQuiz(a.progress, quiz.id, quiz.questions, right);
    expect(b.starsEarned).toBe(0);
    expect(b.alreadyRewarded).toBe(quiz.questions.length);
    expect(b.progress.stars).toBe(a.progress.stars);
    expect(b.progress.quizzes["bn-chena"]).toEqual({ best: 100, attempts: 2 });
  });

  it("a failed quiz is not marked done and keeps the best score", () => {
    const fail = recordHubQuiz(emptyHubProgress(), quiz.id, quiz.questions, {});
    expect(fail.passed).toBe(false);
    expect(isDone(fail.progress, "quiz:bn-chena")).toBe(false);
    const good = recordHubQuiz(fail.progress, quiz.id, quiz.questions, right);
    const again = recordHubQuiz(good.progress, quiz.id, quiz.questions, {});
    expect(again.progress.quizzes["bn-chena"].best).toBe(100);
  });

  it("marks items done once and counts completion", () => {
    let p = markDone(emptyHubProgress(), "bn-letter:অ");
    p = markDone(p, "bn-letter:অ");
    expect(p.done).toEqual(["bn-letter:অ"]);
    expect(countDone(p, ["bn-letter:অ", "bn-letter:আ"])).toEqual({ done: 1, total: 2 });
    const t1 = awardStar(p, "trace:অ");
    const t2 = awardStar(t1.progress, "trace:অ");
    expect([t1.awarded, t2.awarded]).toEqual([true, false]);
    expect(t2.progress.stars).toBe(1);
  });

  it("restores saved progress and survives broken storage", () => {
    const a = recordHubQuiz(markDone(emptyHubProgress(), "poem-read:gram"), quiz.id, quiz.questions, right).progress;
    expect(parseHubProgress(JSON.stringify(a))).toEqual(a);
    expect(parseHubProgress("{oops")).toEqual(emptyHubProgress());
    expect(parseHubProgress(JSON.stringify({ version: 2 }))).toEqual(emptyHubProgress());
    expect(parseHubProgress(JSON.stringify({ version: 1, stars: -3, done: [1, "x"], quizzes: { q: { best: 500, attempts: 1 } } })))
      .toEqual({ version: 1, done: ["x"], quizzes: { q: { best: 100, attempts: 1 } }, starKeys: [], stars: 0 });
  });

  it("math completion reads the Bangla-math store", () => {
    expect(mathCompletion({ quizzes: {}, groupsSeen: [], lessonsSeen: [] })).toEqual({ done: 0, total: 29 });
    expect(mathCompletion({ quizzes: { "add-1": { bestPct: 80 }, "sub-1": { bestPct: 40 } }, groupsSeen: [1, 2], lessonsSeen: ["add"] }).done).toBe(4);
  });
});

describe("hub catalog", () => {
  it("has the five folders with working sections", () => {
    expect(FOLDERS.map((f) => f.id)).toEqual(["bangla", "english", "math", "poems", "stories"]);
    expect(FOLDERS.find((f) => f.id === "bangla")!.sections.map((s) => s.title)).toEqual(["স্বরবর্ণ", "ব্যঞ্জনবর্ণ", "অক্ষর চেনা", "অক্ষর লেখা", "শব্দ শেখা", "শব্দ থেকে বাক্য"]);
    expect(FOLDERS.find((f) => f.id === "english")!.sections).toHaveLength(6);
    expect(FOLDERS.find((f) => f.id === "math")!.sections).toHaveLength(7);
    for (const f of FOLDERS) for (const s of f.sections) {
      expect(s.href.startsWith("/shikhi") || s.href.startsWith("/bangla-math")).toBe(true);
      for (const item of s.items) if (item.startsWith("quiz:")) expect(isHubQuizId(item.slice(5))).toBe(true);
    }
  });

  it("every quiz knows where to go back to", () => {
    for (const id of GENERATED_QUIZ_IDS) expect(quizBackHref(id).startsWith("/shikhi/")).toBe(true);
    expect(quizBackHref("bn-chena")).toBe("/shikhi/bangla/chena");
    expect(quizBackHref("poem-gram")).toBe("/shikhi/poems/gram");
    expect(quizBackHref("story-en-pip-the-seed")).toBe("/shikhi/stories/en-pip-the-seed");
    expect(MATH_PUZZLES.every((p) => p.href === `/bangla-math/quiz/${p.id}`)).toBe(true);
  });
});

describe("pronunciation guides and meanings", () => {
  const BN = /[\u0980-\u09FF]/;
  it("every Bangla letter has a name and a sound in English letters", () => {
    for (const l of ALL_BN_LETTERS) {
      const g = bnLetterGuide(l.letter);
      expect(g).toBeTruthy();
      expect(/^[a-z-]+$/.test(g!.name)).toBe(true);
      expect(/[a-z]/.test(g!.sound)).toBe(true); // may also name a Bangla letter, e.g. "a longer ই"
    }
    expect(Object.keys(BN_LETTER_GUIDE)).toHaveLength(ALL_BN_LETTERS.length);
  });

  it("every Bangla picture word has a romanised pronunciation and an English meaning", () => {
    const words = [...ALL_BN_LETTERS.map((l) => l.word), ...BN_EXTRA_WORDS.map((w) => w.word)];
    for (const w of words) {
      const g = bnWordGuide(w);
      expect(g).toBeTruthy();
      expect(/^[a-z]+$/.test(g!.say)).toBe(true);
      expect(g!.en.length > 0 && !BN.test(g!.en)).toBe(true);
    }
    expect(Object.keys(BN_WORD_GUIDE)).toHaveLength(new Set(words.map((w) => w.normalize("NFC"))).size);
    expect(bnWordGuide("অজগর")).toEqual({ say: "ojogor", en: "python (a big snake)" });
    expect(bnWordGuide("কলা")!.en).toBe("banana");
  });

  it("every English picture and spelling word has a Bangla-script pronunciation", () => {
    for (const w of [...ALPHABET.map((l) => l.word), ...SPELLING_WORDS.map((w) => w.word)]) {
      const say = enWordSay(w);
      expect(say).toBeTruthy();
      expect(BN.test(say!) && !/[A-Za-z]/.test(say!)).toBe(true);
    }
    expect(enWordSay("Apple")).toBe("অ্যাপল");
    expect(Object.keys(EN_WORD_SAY).every((k) => k === k.toLowerCase())).toBe(true);
  });
});

