/**
 * Suggested Bangla learning paths by age. They are *suggestions*: every topic
 * stays open to every child, the path only decides what is shown first and the
 * starting difficulty. Children (or parents) can change the age group any time.
 */
import type { OpId } from "./lessons";

export type BnTopic = "numbers" | OpId;
export const BN_TOPICS: BnTopic[] = ["numbers", "add", "sub", "mul", "div"];

export type BnLevel = 1 | 2 | 3;
export const BN_LEVELS: BnLevel[] = [1, 2, 3];
export const LEVEL_NAME: Record<BnLevel, string> = { 1: "সহজ", 2: "মাঝারি", 3: "কঠিন" };

export type BnAgeGroup = "3-4" | "5-6" | "7-8";

export interface AgePath {
  id: BnAgeGroup;
  label: string; // "৩–৪ বছর"
  emoji: string;
  title: string;
  description: string;
  /** Topics shown first ("তোমার জন্য"). */
  focus: BnTopic[];
  /** Starting difficulty for every topic. */
  levels: Record<BnTopic, BnLevel>;
}

export const AGE_PATHS: AgePath[] = [
  {
    id: "3-4", label: "৩–৪ বছর", emoji: "🐣", title: "ছোট্ট গণিতবিদ",
    description: "সংখ্যা চেনা আর ছবি গুনে গুনে শেখা।",
    focus: ["numbers"],
    levels: { numbers: 1, add: 1, sub: 1, mul: 1, div: 1 },
  },
  {
    id: "5-6", label: "৫–৬ বছর", emoji: "🐥", title: "যোগ-বিয়োগের বন্ধু",
    description: "১০০ পর্যন্ত সংখ্যা, সহজ যোগ আর বিয়োগ।",
    focus: ["numbers", "add", "sub"],
    levels: { numbers: 2, add: 1, sub: 1, mul: 1, div: 1 },
  },
  {
    id: "7-8", label: "৭–৮ বছর", emoji: "🦅", title: "গণিত চ্যাম্পিয়ন",
    description: "গুণ, ভাগ, নামতা আর একটু কঠিন অনুশীলন।",
    focus: ["mul", "div", "add", "sub"],
    levels: { numbers: 3, add: 3, sub: 3, mul: 2, div: 2 },
  },
];

export function agePath(id: BnAgeGroup | null | undefined): AgePath | null {
  return AGE_PATHS.find((p) => p.id === id) ?? null;
}

export function isAgeGroup(x: unknown): x is BnAgeGroup {
  return x === "3-4" || x === "5-6" || x === "7-8";
}

/** Starting level for a topic; with no age group chosen yet we start easy. */
export function suggestedLevel(age: BnAgeGroup | null, topic: BnTopic): BnLevel {
  return agePath(age)?.levels[topic] ?? 1;
}

/** Topics ordered for this child: focus topics first, the rest after. */
export function orderedTopics(age: BnAgeGroup | null): { topic: BnTopic; recommended: boolean }[] {
  const focus = agePath(age)?.focus ?? BN_TOPICS;
  return [
    ...focus.map((topic) => ({ topic, recommended: !!age })),
    ...BN_TOPICS.filter((t) => !focus.includes(t)).map((topic) => ({ topic, recommended: false })),
  ];
}

/** Short Bangla instruction adapted to the age group. */
export function instructionFor(age: BnAgeGroup | null): string {
  switch (age) {
    case "3-4": return "ছবি দেখো, গুনে গুনে উত্তরে চাপ দাও। কেউ পাশে থেকে পড়ে শোনাতে পারে।";
    case "5-6": return "প্রশ্নটা পড়ো, তারপর ঠিক উত্তরে চাপ দাও।";
    case "7-8": return "মন দিয়ে পড়ো। দরকার হলে কাগজে লিখে হিসাব করো।";
    default: return "প্রশ্নটা দেখো, তারপর ঠিক উত্তরে চাপ দাও।";
  }
}
