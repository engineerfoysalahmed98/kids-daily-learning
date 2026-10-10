/**
 * Bangla explanations for যোগ, বিয়োগ, গুণ and ভাগ — simple sentences, everyday
 * objects (আম, কলা, ফুল, খেলনা…) and worked examples with pictures.
 */
import { toBn } from "./numbers";

export type OpId = "add" | "sub" | "mul" | "div";
export const OP_IDS: OpId[] = ["add", "sub", "mul", "div"];

export interface BnObject { emoji: string; name: string }

/** Everyday things children in Bangladesh know. Counted with "টি". */
export const OBJECTS: BnObject[] = [
  { emoji: "🥭", name: "আম" },
  { emoji: "🍌", name: "কলা" },
  { emoji: "🌸", name: "ফুল" },
  { emoji: "🧸", name: "খেলনা" },
  { emoji: "⚽", name: "বল" },
  { emoji: "🐦", name: "পাখি" },
  { emoji: "🐟", name: "মাছ" },
  { emoji: "🎈", name: "বেলুন" },
];

export const KID_NAMES = ["রিনা", "রাফি", "তানহা", "সুমন", "মিতু", "আরিফ", "নাদিয়া", "জামিল"];

export function compute(op: OpId, a: number, b: number): number {
  switch (op) {
    case "add": return a + b;
    case "sub": return a - b;
    case "mul": return a * b;
    case "div": return a / b;
  }
}

export const SIGN: Record<OpId, string> = { add: "+", sub: "−", mul: "×", div: "÷" };

/** "২ + ৩ = ৫" */
export function equationText(op: OpId, a: number, b: number, showAnswer = true): string {
  return `${toBn(a)} ${SIGN[op]} ${toBn(b)} = ${showAnswer ? toBn(compute(op, a, b)) : "?"}`;
}

/** Bangla possessive: রিনা → রিনার, সুমন → সুমনের. */
export function possessive(name: string): string {
  return /[\u09BE-\u09CC\u0985-\u0994]$/.test(name) ? `${name}র` : `${name}ের`;
}

/** One short Bangla sentence that tells the story of an equation. */
export function storySentence(op: OpId, a: number, b: number, obj: BnObject, kid = "রিনা"): string {
  const r = compute(op, a, b);
  const n = (x: number) => `${toBn(x)}টি ${obj.name}`;
  switch (op) {
    case "add": return `${possessive(kid)} কাছে ${n(a)} ছিল। আরও ${n(b)} এল। এখন মোট ${n(r)}।`;
    case "sub": return `${possessive(kid)} কাছে ${n(a)} ছিল। ${toBn(b)}টি দিয়ে দিল। এখন বাকি আছে ${n(r)}।`;
    case "mul": return `${toBn(a)}টি দলে ${toBn(b)}টি করে ${obj.name} থাকলে মোট ${n(r)}।`;
    case "div": return `${n(a)} ${toBn(b)} জন শিশুর মধ্যে সমানভাবে ভাগ করলে প্রত্যেকে ${toBn(r)}টি করে পাবে।`;
  }
}

/** Repeated addition for গুণ: 3 × 2 → "২ + ২ + ২ = ৬". */
export function repeatedAddition(a: number, b: number): string {
  return `${Array.from({ length: a }, () => toBn(b)).join(" + ")} = ${toBn(a * b)}`;
}

export interface WorkedExample { a: number; b: number; obj: BnObject; kid: string }

export interface OpLesson {
  id: OpId;
  bn: string; // "যোগ"
  en: string; // "Addition"
  icon: string;
  tone: "math" | "science" | "english" | "story";
  /** Very short Bangla explanation, one idea per line. */
  intro: string[];
  signNote: string;
  examples: WorkedExample[];
  tip: string;
  /** Which part of the answer is called what (যোগফল, বিয়োগফল…). */
  resultWord: string;
}

const o = (name: string) => OBJECTS.find((x) => x.name === name)!;

export const OP_LESSONS: Record<OpId, OpLesson> = {
  add: {
    id: "add", bn: "যোগ", en: "Addition", icon: "➕", tone: "science", resultWord: "যোগফল",
    intro: [
      "যোগ মানে একসাথে করা।",
      "দুই দলের জিনিস এক জায়গায় রাখলে মোট কতগুলো হলো — সেটাই যোগফল।",
    ],
    signNote: "‘+’ হলো যোগ চিহ্ন। ‘=’ মানে সমান।",
    examples: [
      { a: 2, b: 3, obj: o("আম"), kid: "রিনা" },
      { a: 4, b: 5, obj: o("ফুল"), kid: "মিতু" },
      { a: 12, b: 6, obj: o("বেলুন"), kid: "আরিফ" },
    ],
    tip: "বড় সংখ্যাটা মনে রাখো, তারপর ছোট সংখ্যাটা আঙুলে গুনে সামনে এগিয়ে যাও।",
  },
  sub: {
    id: "sub", bn: "বিয়োগ", en: "Subtraction", icon: "➖", tone: "english", resultWord: "বিয়োগফল",
    intro: [
      "বিয়োগ মানে কিছু সরিয়ে নেওয়া বা কমে যাওয়া।",
      "যা ছিল তা থেকে কিছু চলে গেলে কতগুলো বাকি থাকল — সেটাই বিয়োগফল।",
    ],
    signNote: "‘−’ হলো বিয়োগ চিহ্ন। বড় সংখ্যা থেকে ছোট সংখ্যা বাদ দিই।",
    examples: [
      { a: 5, b: 2, obj: o("কলা"), kid: "রাফি" },
      { a: 9, b: 4, obj: o("বল"), kid: "সুমন" },
      { a: 15, b: 7, obj: o("পাখি"), kid: "তানহা" },
    ],
    tip: "বড় সংখ্যা থেকে পেছনের দিকে গোনো: ৫ … ৪, ৩ — উত্তর ৩!",
  },
  mul: {
    id: "mul", bn: "গুণ", en: "Multiplication", icon: "✖️", tone: "math", resultWord: "গুণফল",
    intro: [
      "গুণ মানে একই সংখ্যা বারবার যোগ করা।",
      "সমান সমান দল থাকলে গুণ করে খুব তাড়াতাড়ি মোট বের করা যায়।",
    ],
    signNote: "‘×’ হলো গুণ চিহ্ন। ৩ × ২ মানে ৩টি দল, প্রতিটি দলে ২টি করে।",
    examples: [
      { a: 3, b: 2, obj: o("ফুল"), kid: "নাদিয়া" },
      { a: 2, b: 5, obj: o("আম"), kid: "জামিল" },
      { a: 4, b: 3, obj: o("খেলনা"), kid: "রিনা" },
    ],
    tip: "নামতা মুখস্থ থাকলে গুণ আরও সহজ হয়ে যায়!",
  },
  div: {
    id: "div", bn: "ভাগ", en: "Division", icon: "➗", tone: "story", resultWord: "ভাগফল",
    intro: [
      "ভাগ মানে সমান সমান করে ভাগ করে দেওয়া।",
      "সবাই যেন একই সংখ্যক জিনিস পায় — প্রত্যেকে কতটি পেল, সেটাই ভাগফল।",
    ],
    signNote: "‘÷’ হলো ভাগ চিহ্ন।",
    examples: [
      { a: 6, b: 2, obj: o("আম"), kid: "রিনা" },
      { a: 10, b: 5, obj: o("কলা"), kid: "রাফি" },
      { a: 12, b: 3, obj: o("বেলুন"), kid: "মিতু" },
    ],
    tip: "ভাগ হলো গুণের উল্টো: ২ × ৩ = ৬, তাই ৬ ÷ ২ = ৩।",
  },
};

/** নামতা (multiplication table) rows for one number: "৩ × ১ = ৩" … "৩ × ১০ = ৩০". */
export function timesTable(n: number, upTo = 10): { a: number; b: number; product: number; text: string }[] {
  return Array.from({ length: upTo }, (_, i) => ({ a: n, b: i + 1, product: n * (i + 1), text: `${toBn(n)} × ${toBn(i + 1)} = ${toBn(n * (i + 1))}` }));
}
