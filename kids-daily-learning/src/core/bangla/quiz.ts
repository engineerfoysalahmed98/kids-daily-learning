/**
 * Bangla quiz generators for numbers, যোগ, বিয়োগ, গুণ and ভাগ.
 *
 * Questions reuse the app's Question/Activity types, so the existing QuizRunner,
 * QuestionView and scoring engine run them unchanged.
 *
 * Every math question id encodes the problem: `bnm.<op>.<a>.<b>.<variant>`
 * (`variant` = res | pic | story | miss | type). The id is also the star key, so
 * answering the same problem again never earns a second star. Tests recompute
 * each answer from the id to prove every question is mathematically correct.
 */
import type { Activity, Level, Question } from "../types";
import { createRng, type Rng } from "../engine/util";
import { bnName, enName, NUMBER_GROUPS, toBn } from "./numbers";
import { compute, equationText, KID_NAMES, OBJECTS, OP_LESSONS, possessive, repeatedAddition, SIGN, type BnObject, type OpId } from "./lessons";
import { LEVEL_NAME, type BnLevel, type BnTopic } from "./levels";

// ---------------------------------------------------------------- quiz ids

export interface QuizSpec { topic: BnTopic; level: BnLevel; group?: number }

/** "add-2" | "numbers-1" | "numbers-g7" */
export function quizId(spec: QuizSpec): string {
  return spec.group ? `numbers-g${spec.group}` : `${spec.topic}-${spec.level}`;
}

export function parseQuizId(id: string): QuizSpec | null {
  const g = /^numbers-g(10|[1-9])$/.exec(id);
  if (g) {
    const group = Number(g[1]);
    return { topic: "numbers", group, level: group <= 2 ? 1 : group <= 5 ? 2 : 3 };
  }
  const m = /^(numbers|add|sub|mul|div)-([123])$/.exec(id);
  return m ? { topic: m[1] as BnTopic, level: Number(m[2]) as BnLevel } : null;
}

export const TOPIC_META: Record<BnTopic, { bn: string; en: string; icon: string; quizTitle: string; tone: "gk" | "science" | "english" | "math" | "story" }> = {
  numbers: { bn: "সংখ্যা", en: "Numbers", icon: "🔢", quizTitle: "সংখ্যা চেনার খেলা", tone: "gk" },
  add: { bn: OP_LESSONS.add.bn, en: "Addition", icon: OP_LESSONS.add.icon, quizTitle: "যোগের খেলা", tone: OP_LESSONS.add.tone },
  sub: { bn: OP_LESSONS.sub.bn, en: "Subtraction", icon: OP_LESSONS.sub.icon, quizTitle: "বিয়োগের খেলা", tone: OP_LESSONS.sub.tone },
  mul: { bn: OP_LESSONS.mul.bn, en: "Multiplication", icon: OP_LESSONS.mul.icon, quizTitle: "গুণের খেলা", tone: OP_LESSONS.mul.tone },
  div: { bn: OP_LESSONS.div.bn, en: "Division", icon: OP_LESSONS.div.icon, quizTitle: "ভাগের খেলা", tone: OP_LESSONS.div.tone },
};

export function quizLength(spec: QuizSpec): number {
  return spec.level === 1 ? 5 : 6;
}

/** Builds a short quiz. `seed` changes each try so "আবার খেলো" gives new questions. */
export function buildBnQuiz(id: string, seed: string | number): Activity | null {
  const spec = parseQuizId(id);
  if (!spec) return null;
  const rng = createRng(`${id}|${seed}`);
  const count = quizLength(spec);
  const questions = spec.topic === "numbers" ? numberQuestions(spec, count, rng) : opQuestions(spec.topic, spec.level, count, rng);
  const meta = TOPIC_META[spec.topic];
  const group = spec.group ? NUMBER_GROUPS[spec.group - 1] : null;
  return {
    id: `bn-quiz.${id}`,
    track: "math",
    subject: "math",
    kind: "quiz",
    title: group ? `সংখ্যা ${group.title}` : `${meta.quizTitle} · ${LEVEL_NAME[spec.level]}`,
    description: "",
    icon: group ? group.emoji : meta.icon,
    difficulty: spec.level as Level,
    minutes: 3,
    questions,
  };
}

// ---------------------------------------------------------------- helpers

function mcFrom(id: string, prompt: string, correct: string, distractors: string[], explain: string, rng: Rng, visual?: string, speak?: string): Question {
  const set = new Set<string>([correct]);
  for (const d of distractors) { if (set.size >= 4) break; if (d) set.add(d); }
  const options = rng.shuffle([...set]);
  return { id, type: "mc", prompt, options, answer: options.indexOf(correct), explain, visual, speak };
}

/** Plausible wrong numbers near `n`, kept within [min, max] and never equal to n. */
export function nearNumbers(n: number, rng: Rng, min = 0, max = 200): number[] {
  const swap = n >= 10 && n % 10 !== Math.floor(n / 10) && n < 100 ? [Number(String(n).split("").reverse().join(""))] : [];
  const tens = n >= 10 ? [n + 10, n - 10] : [];
  const pool = [n + 1, n - 1, n + 2, n - 2, ...swap, ...tens, n + 3, n - 3];
  const out: number[] = [];
  for (const v of rng.shuffle(pool)) if (v !== n && v >= min && v <= max && !out.includes(v)) out.push(v);
  return out;
}

/** "🥭🥭🥭🥭🥭 🥭🥭" — groups of five so small children can count. */
export function objectRow(emoji: string, count: number): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i += 5) parts.push(emoji.repeat(Math.min(5, count - i)));
  return parts.join(" ");
}

function uniquePush(qs: Question[], ids: Set<string>, q: Question | null): boolean {
  if (!q || ids.has(q.id)) return false;
  ids.add(q.id);
  qs.push(q);
  return true;
}

// ---------------------------------------------------------------- numbers

type NumKind = "count" | "read" | "name" | "en" | "next" | "prev" | "bigger";

function numberRange(spec: QuizSpec): [number, number] {
  if (spec.group) { const g = NUMBER_GROUPS[spec.group - 1]; return [g.from, g.to]; }
  return spec.level === 1 ? [1, 10] : spec.level === 2 ? [1, 50] : [1, 100];
}

function numberKinds(spec: QuizSpec, hi: number): NumKind[] {
  if (spec.group) return hi <= 20 ? ["count", "read", "name", "en", "next", "bigger"] : ["read", "name", "en", "next", "prev", "bigger"];
  if (spec.level === 1) return ["count", "count", "read", "next", "bigger"];
  if (spec.level === 2) return ["count", "read", "name", "en", "next", "prev", "bigger"];
  return ["read", "name", "en", "next", "prev", "bigger"];
}

function numberQuestion(kind: NumKind, n: number, lo: number, hi: number, rng: Rng): Question | null {
  const near = nearNumbers(n, rng, 1, 100);
  const bn = toBn(n);
  switch (kind) {
    case "count": {
      if (n > 20) return null;
      const obj = rng.pick(OBJECTS);
      return mcFrom(`bnn.count.${n}`, `কয়টি ${obj.name} আছে? গুনে দেখো।`, bn, near.map(toBn),
        `গুনে দেখো: ${Array.from({ length: Math.min(n, 5) }, (_, i) => toBn(i + 1)).join(", ")}${n > 5 ? " …" : ""} — মোট ${bn}টি ${obj.name}।`, rng,
        objectRow(obj.emoji, n), `কয়টি ${obj.name} আছে?`);
    }
    case "read":
      return mcFrom(`bnn.read.${n}`, `‘${bnName(n)}’ কোন সংখ্যা?`, bn, near.map(toBn), `${bnName(n)} লেখা হয় ${bn} (ইংরেজিতে ${n})।`, rng, undefined, `${bnName(n)} কোন সংখ্যা?`);
    case "name":
      return mcFrom(`bnn.name.${n}`, `এই সংখ্যাটির নাম কী?`, bnName(n), near.map(bnName), `${bn} সংখ্যাটির নাম ${bnName(n)}।`, rng, bn);
    case "en":
      return mcFrom(`bnn.en.${n}`, `${bn} ইংরেজি অঙ্কে কীভাবে লেখে?`, String(n), near.map(String), `${bn} = ${n}। ইংরেজিতে বলে “${enName(n)}”।`, rng);
    case "next":
      if (n >= 100) return null;
      return mcFrom(`bnn.next.${n}`, `${bn}-এর ঠিক পরের সংখ্যা কোনটি?`, toBn(n + 1), [n - 1, n + 2, n + 10, n].filter((x) => x >= 1 && x <= 100 && x !== n + 1).map(toBn),
        `${bn}-এর পরে আসে ${toBn(n + 1)} (${bnName(n + 1)})।`, rng);
    case "prev":
      if (n <= 1) return null;
      return mcFrom(`bnn.prev.${n}`, `${bn}-এর ঠিক আগের সংখ্যা কোনটি?`, toBn(n - 1), [n + 1, n - 2, n - 10, n].filter((x) => x >= 1 && x <= 100 && x !== n - 1).map(toBn),
        `${bn}-এর আগে আসে ${toBn(n - 1)} (${bnName(n - 1)})।`, rng);
    case "bigger": {
      const others = rng.shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((x) => x !== n)).slice(0, 2);
      if (others.length < 2) return null;
      const all = [n, ...others];
      const max = Math.max(...all);
      const min = Math.min(...all);
      return mcFrom(`bnn.bigger.${[...all].sort((a, b) => a - b).join("-")}`, "কোন সংখ্যাটি সবচেয়ে বড়?", toBn(max), all.filter((x) => x !== max).map(toBn),
        `${toBn(max)} সবচেয়ে বড়, আর ${toBn(min)} সবচেয়ে ছোট।`, rng);
    }
  }
}

function numberQuestions(spec: QuizSpec, count: number, rng: Rng): Question[] {
  const [lo, hi] = numberRange(spec);
  const kinds = numberKinds(spec, hi);
  const qs: Question[] = [];
  const ids = new Set<string>();
  let guard = 0;
  while (qs.length < count && guard++ < 400) {
    const kind = kinds[qs.length % kinds.length];
    const n = kind === "count" ? rng.int(lo, Math.min(hi, 20)) : rng.int(lo, hi);
    uniquePush(qs, ids, numberQuestion(kind, n, lo, hi, rng));
  }
  return rng.shuffle(qs);
}

// ---------------------------------------------------------------- arithmetic

export interface Problem { op: OpId; a: number; b: number; result: number }

/** Picks numbers for one problem. All results are whole numbers ≥ 0 (division always exact). */
export function makeProblem(op: OpId, level: BnLevel, rng: Rng): Problem {
  let a: number;
  let b: number;
  switch (op) {
    case "add":
      if (level === 1) { a = rng.int(1, 4); b = rng.int(1, 5 - a); }
      else if (level === 2) { a = rng.int(1, 9); b = rng.int(1, 10 - a); }
      else if (rng.next() < 0.5) { a = rng.int(5, 15); b = rng.int(2, 20 - a); }
      else { // two-digit, no carrying: 23 + 14
        const t1 = rng.int(1, 6), t2 = rng.int(1, 8 - t1), o1 = rng.int(0, 8), o2 = rng.int(0, 9 - o1);
        a = t1 * 10 + o1; b = t2 * 10 + o2;
      }
      break;
    case "sub":
      if (level === 1) { a = rng.int(2, 5); b = rng.int(1, a - 1); }
      else if (level === 2) { a = rng.int(3, 10); b = rng.int(1, a - 1); }
      else if (rng.next() < 0.5) { a = rng.int(11, 20); b = rng.int(2, a - 1); }
      else { // two-digit, no borrowing: 47 − 23
        const t1 = rng.int(3, 9), t2 = rng.int(1, t1 - 1), o1 = rng.int(1, 9), o2 = rng.int(0, o1);
        a = t1 * 10 + o1; b = t2 * 10 + o2;
      }
      break;
    case "mul": // a groups of b
      if (level === 1) { a = rng.int(2, 3); b = rng.int(1, 3); }
      else if (level === 2) { a = rng.int(2, 5); b = rng.int(1, 5); }
      else { a = rng.int(2, 10); b = rng.int(2, 10); }
      break;
    case "div": { // a ÷ b = q, always exact
      let q: number;
      if (level === 1) { b = 2; q = rng.int(1, 5); }
      else if (level === 2) { b = rng.int(2, 5); q = rng.int(1, 5); }
      else { b = rng.int(2, 10); q = rng.int(2, 10); }
      a = b * q;
      break;
    }
  }
  return { op, a, b, result: compute(op, a, b) };
}

type OpVariant = "res" | "pic" | "story" | "miss" | "type";

function variantsFor(op: OpId, level: BnLevel): OpVariant[] {
  if (level === 1) return ["pic", "pic", "res", "story", "pic"];
  if (level === 2) return op === "mul" || op === "div" ? ["pic", "res", "story", "res", "miss", "story"] : ["res", "pic", "story", "miss", "res", "story"];
  return ["res", "story", "miss", "type", "res", "story"];
}

/** Bangla explanation for one problem — never says "wrong", just shows the way. */
export function explainProblem(p: Problem): string {
  const [a, b, r] = [toBn(p.a), toBn(p.b), toBn(p.result)];
  switch (p.op) {
    case "add": return `${a} আর ${b} একসাথে করলে হয় ${r}। তাই ${a} + ${b} = ${r}।`;
    case "sub": return `${a} থেকে ${b} সরিয়ে নিলে বাকি থাকে ${r}। তাই ${a} − ${b} = ${r}।`;
    case "mul": return p.a <= 5
      ? `${a}টি দলে ${b}টি করে: ${repeatedAddition(p.a, p.b)}। তাই ${a} × ${b} = ${r}।`
      : `${a}টি দলে ${b}টি করে থাকলে মোট ${r}টি। নামতায় দেখো: ${a} × ${b} = ${r}।`;
    case "div": return `${a}টি জিনিস ${b} জনের মধ্যে সমান ভাগ করলে প্রত্যেকে পায় ${r}টি। কারণ ${b} × ${r} = ${a}।`;
  }
}

function picture(p: Problem, obj: BnObject): string | null {
  switch (p.op) {
    case "add": return p.result <= 10 ? `${objectRow(obj.emoji, p.a)}  ➕  ${objectRow(obj.emoji, p.b)}` : null;
    case "sub": return p.a <= 10 ? `${objectRow(obj.emoji, p.a)}  ➖  ${obj.emoji.repeat(p.b)}` : null;
    case "mul": return p.a * p.b <= 25 ? Array.from({ length: p.a }, () => `(${obj.emoji.repeat(p.b)})`).join(" ") : null;
    case "div": return p.a <= 20 ? `${objectRow(obj.emoji, p.a)}  ➗  ${"🧒".repeat(p.b)}` : null;
  }
}

function storyPrompt(p: Problem, obj: BnObject, kid: string): string {
  const [a, b] = [toBn(p.a), toBn(p.b)];
  switch (p.op) {
    case "add": return `${possessive(kid)} কাছে ${a}টি ${obj.name} আছে। মা আরও ${b}টি ${obj.name} দিলেন। এখন মোট কয়টি ${obj.name}?`;
    case "sub": return `${possessive(kid)} কাছে ${a}টি ${obj.name} ছিল। বন্ধুকে ${b}টি দিল। এখন কয়টি ${obj.name} বাকি?`;
    case "mul": return `${a}টি ঝুড়িতে ${b}টি করে ${obj.name} আছে। মোট কয়টি ${obj.name}?`;
    case "div": return `${a}টি ${obj.name} ${b} জন বন্ধুর মধ্যে সমানভাবে ভাগ করা হলো। প্রত্যেকে কয়টি পাবে?`;
  }
}

function opQuestion(p: Problem, variant: OpVariant, rng: Rng): Question | null {
  const id = `bnm.${p.op}.${p.a}.${p.b}.${variant}`;
  const r = p.result;
  const explain = explainProblem(p);
  const min = p.op === "div" ? 1 : 0;
  const obj = rng.pick(OBJECTS);
  switch (variant) {
    case "res":
      return mcFrom(id, `${equationText(p.op, p.a, p.b, false)}`, toBn(r), nearNumbers(r, rng, min).map(toBn), explain, rng, undefined,
        `${toBn(p.a)} ${OP_SPOKEN[p.op]} ${toBn(p.b)} সমান কত?`);
    case "pic": {
      const vis = picture(p, obj);
      if (!vis) return null;
      const ask = p.op === "div" ? `${toBn(p.a)}টি ${obj.name} ${toBn(p.b)} জনের মধ্যে সমান ভাগ করো। প্রত্যেকে কয়টি পাবে?`
        : p.op === "sub" ? `${toBn(p.a)}টি ${obj.name} থেকে ${toBn(p.b)}টি সরিয়ে নিলে কয়টি থাকবে?`
        : p.op === "mul" ? `${toBn(p.a)}টি দলে ${toBn(p.b)}টি করে ${obj.name}। মোট কয়টি?`
        : `${toBn(p.a)}টি ${obj.name} আর ${toBn(p.b)}টি ${obj.name} — মোট কয়টি?`;
      return mcFrom(id, ask, toBn(r), nearNumbers(r, rng, min).map(toBn), explain, rng, vis);
    }
    case "story":
      return mcFrom(id, storyPrompt(p, obj, rng.pick(KID_NAMES)), toBn(r), nearNumbers(r, rng, min).map(toBn), explain, rng, equationText(p.op, p.a, p.b, false));
    case "miss":
      return mcFrom(id, `খালি ঘরে কোন সংখ্যা বসবে?`, toBn(p.b), nearNumbers(p.b, rng, p.op === "div" || p.op === "mul" ? 1 : 0).map(toBn),
        `${MISSING_HINT[p.op](toBn(p.a), toBn(p.b), toBn(r))} তাই ${toBn(p.a)} ${SIGN[p.op]} ${toBn(p.b)} = ${toBn(r)}।`, rng,
        `${toBn(p.a)} ${SIGN[p.op]} ☐ = ${toBn(r)}`);
    case "type":
      return { id, type: "type", prompt: `উত্তর লেখো: ${equationText(p.op, p.a, p.b, false)}`, accept: [toBn(r), String(r)], inputMode: "numeric",
        placeholder: "সংখ্যা লেখো", explain, speak: `${toBn(p.a)} ${OP_SPOKEN[p.op]} ${toBn(p.b)} সমান কত?` };
  }
}

/** How to find the missing number, in one simple Bangla sentence. */
const MISSING_HINT: Record<OpId, (a: string, b: string, r: string) => string> = {
  add: (a, b, r) => `${r} থেকে ${a} বাদ দিলে পাই ${b}।`,
  sub: (a, b, r) => `${a} থেকে ${r} বাদ দিলে পাই ${b}।`,
  mul: (a, b, r) => `${r}-কে ${a} দিয়ে ভাগ করলে পাই ${b}।`,
  div: (a, b, r) => `${a}-কে ${r} দিয়ে ভাগ করলে পাই ${b}।`,
};

const OP_SPOKEN: Record<OpId, string> = { add: "যোগ", sub: "বিয়োগ", mul: "গুণ", div: "ভাগ" };

function opQuestions(op: OpId, level: BnLevel, count: number, rng: Rng): Question[] {
  const variants = variantsFor(op, level);
  const qs: Question[] = [];
  const ids = new Set<string>();
  let guard = 0;
  while (qs.length < count && guard++ < 400) {
    const v = variants[qs.length % variants.length];
    const p = makeProblem(op, level, rng);
    if (!uniquePush(qs, ids, opQuestion(p, v, rng)) && guard > 200) uniquePush(qs, ids, opQuestion(p, "res", rng));
  }
  return qs;
}
