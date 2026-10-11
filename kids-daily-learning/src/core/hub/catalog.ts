/**
 * The Learning Hub map: 5 folders → subsections → trackable items.
 * Every href here points at a real page; tests check that each section's
 * items exist so no card is a placeholder.
 */
import { ALL_BN_LETTERS, BN_SENTENCES, CONSONANTS, VOWELS } from "./bangla";
import { ALPHABET, EN_SENTENCES } from "./english";
import { POEMS } from "./poems";
import { HUB_STORIES } from "./stories";

export const HUB = "/shikhi";

export type FolderId = "bangla" | "english" | "math" | "poems" | "stories";
export type Tone = "english" | "math" | "science" | "gk" | "story" | "brain" | "creativity" | "habit" | "sun";

export interface HubSection {
  id: string;
  title: string;
  /** Short English label shown under Bangla titles. */
  en?: string;
  icon: string;
  description: string;
  href: string;
  /** Items that count toward completion (see core/hub/progress.ts). */
  items: string[];
}

export interface HubFolder {
  id: FolderId;
  title: string;
  en: string;
  icon: string;
  tone: Tone;
  description: string;
  href: string;
  lang: "bn" | "en";
  sections: HubSection[];
}

const letterItems = (letters: { letter: string }[]) => letters.map((l) => `bn-letter:${l.letter}`);

export const BN_SECTIONS: HubSection[] = [
  { id: "shoroborno", title: "স্বরবর্ণ", en: "Vowels", icon: "🅰️", description: "১১টি স্বরবর্ণ — ছবি আর শব্দ দিয়ে।", href: `${HUB}/bangla/shoroborno`, items: letterItems(VOWELS) },
  { id: "byanjonborno", title: "ব্যঞ্জনবর্ণ", en: "Consonants", icon: "🔤", description: "ক থেকে ঁ — ৩৯টি ব্যঞ্জনবর্ণ।", href: `${HUB}/bangla/byanjonborno`, items: letterItems(CONSONANTS) },
  { id: "chena", title: "অক্ষর চেনা", en: "Letter cards", icon: "🃏", description: "রঙিন কার্ড উল্টে অক্ষর চেনো, তারপর মেলানোর খেলা।", href: `${HUB}/bangla/chena`, items: ["quiz:bn-chena"] },
  { id: "lekha", title: "অক্ষর লেখা", en: "Tracing", icon: "✍️", description: "আঙুল দিয়ে অক্ষরের উপর দিয়ে লেখো।", href: `${HUB}/bangla/lekha`, items: ALL_BN_LETTERS.map((l) => `trace:${l.letter}`) },
  { id: "shobdo", title: "শব্দ শেখা", en: "Picture words", icon: "🖼️", description: "অ–অজগর, আ–আম, ক–কলা — ছবি দেখে শব্দ।", href: `${HUB}/bangla/shobdo`, items: ["quiz:bn-shobdo"] },
  { id: "bakko", title: "শব্দ থেকে বাক্য", en: "Reading", icon: "📝", description: "ছোট ছোট বাক্য পড়ো আর সাজাও।", href: `${HUB}/bangla/bakko`, items: [...BN_SENTENCES.map((s) => `bn-sentence:${s.id}`), "quiz:bn-bakko"] },
];

export const EN_SECTIONS: HubSection[] = [
  { id: "abc", title: "Alphabet A–Z", icon: "🔠", description: "26 letters with pictures and Bangla meanings.", href: `${HUB}/english/abc`, items: [...ALPHABET.map((l) => `en-letter:${l.upper}`), "quiz:en-abc"] },
  { id: "case", title: "Big & small letters", icon: "🔡", description: "Uppercase and lowercase — match and trace.", href: `${HUB}/english/case`, items: ["quiz:en-case"] },
  { id: "phonics", title: "Phonics & sounds", icon: "🗣️", description: "What sound does each letter make?", href: `${HUB}/english/phonics`, items: [...ALPHABET.map((l) => `en-sound:${l.upper}`), "quiz:en-phonics"] },
  { id: "words", title: "Picture words", icon: "🖼️", description: "Learn words with pictures.", href: `${HUB}/english/words`, items: ["quiz:en-words"] },
  { id: "spelling", title: "Vocabulary & spelling", icon: "🐝", description: "Spell easy words and find missing letters.", href: `${HUB}/english/spelling`, items: ["quiz:en-spelling"] },
  { id: "reading", title: "Sentences & reading", icon: "📖", description: "Read simple sentences and build your own.", href: `${HUB}/english/reading`, items: [...EN_SENTENCES.map((s) => `en-sentence:${s.id}`), "quiz:en-reading"] },
];

/** বাংলা গণিত lessons live in /bangla-math; progress comes from that section's own store. */
export const MATH_SECTIONS: HubSection[] = [
  { id: "numbers", title: "বাংলা সংখ্যা ১–১০০", en: "Numbers", icon: "🔢", description: "দশের দলে ১০০ পর্যন্ত সংখ্যা।", href: "/bangla-math/numbers", items: [] },
  { id: "counting", title: "সংখ্যা চেনা ও গোনা", en: "Counting", icon: "🧮", description: "ছবি গুনে সংখ্যা চেনার খেলা।", href: "/bangla-math/quiz/numbers-1", items: [] },
  { id: "add", title: "যোগ", en: "Addition", icon: "➕", description: "একসাথে করলে কত হয়?", href: "/bangla-math/learn/add", items: [] },
  { id: "sub", title: "বিয়োগ", en: "Subtraction", icon: "➖", description: "সরিয়ে নিলে কত থাকে?", href: "/bangla-math/learn/sub", items: [] },
  { id: "mul", title: "গুণ", en: "Multiplication", icon: "✖️", description: "দলে দলে গুনি, নামতা শিখি।", href: "/bangla-math/learn/mul", items: [] },
  { id: "div", title: "ভাগ", en: "Division", icon: "➗", description: "সমান সমান ভাগ করি।", href: "/bangla-math/learn/div", items: [] },
  { id: "puzzles", title: "ছবির ধাঁধা ও কুইজ", en: "Picture puzzles", icon: "🧩", description: "ছবি দেখে অঙ্কের উত্তর দাও।", href: `${HUB}/math/puzzles`, items: [] },
];

export const POEM_ITEMS = POEMS.flatMap((p) => [`poem-read:${p.id}`, `quiz:poem-${p.id}`]);
export const STORY_ITEMS = HUB_STORIES.flatMap((s) => [`story-read:${s.id}`, `quiz:story-${s.id}`]);

export const FOLDERS: HubFolder[] = [
  { id: "bangla", title: "বাংলা শিখি", en: "Bengali Learning", icon: "অ", tone: "english", lang: "bn", href: `${HUB}/bangla`,
    description: "স্বরবর্ণ, ব্যঞ্জনবর্ণ, অক্ষর লেখা, শব্দ আর বাক্য।", sections: BN_SECTIONS },
  { id: "english", title: "English Learning", en: "ইংরেজি শিখি", icon: "🔤", tone: "math", lang: "en", href: `${HUB}/english`,
    description: "A–Z, phonics, picture words, spelling and reading.", sections: EN_SECTIONS },
  { id: "math", title: "বাংলা গণিত", en: "Bengali Math", icon: "🔢", tone: "gk", lang: "bn", href: `${HUB}/math`,
    description: "১–১০০, যোগ, বিয়োগ, গুণ, ভাগ আর ছবির ধাঁধা।", sections: MATH_SECTIONS },
  { id: "poems", title: "কবিতা ও ছড়া", en: "Poems & Rhymes", icon: "🎵", tone: "story", lang: "bn", href: `${HUB}/poems`,
    description: "বয়স অনুযায়ী মজার ছড়া, ছবি আর ছোট প্রশ্ন।", sections: [{ id: "all", title: "সব ছড়া", icon: "🎵", description: "", href: `${HUB}/poems`, items: POEM_ITEMS }] },
  { id: "stories", title: "গল্পের বই", en: "Storybooks", icon: "📚", tone: "creativity", lang: "bn", href: `${HUB}/stories`,
    description: "বাংলা ও ইংরেজি ছোট গল্প — পড়ো, শোনো, প্রশ্নের উত্তর দাও।", sections: [{ id: "all", title: "সব গল্প", icon: "📚", description: "", href: `${HUB}/stories`, items: STORY_ITEMS }] },
];

export function findFolder(id: string): HubFolder | undefined {
  return FOLDERS.find((f) => f.id === id);
}

export function findSection(folder: FolderId, id: string): HubSection | undefined {
  return findFolder(folder)?.sections.find((s) => s.id === id);
}

/** All items of a folder (math is measured separately). */
export function folderItems(folder: HubFolder): string[] {
  return folder.sections.flatMap((s) => s.items);
}

/** Math progress from the Bangla-math store: passed levels, number groups and lessons seen. */
export function mathCompletion(p: { quizzes: Record<string, { bestPct: number }>; groupsSeen: number[]; lessonsSeen: string[] }): { done: number; total: number } {
  const levels = ["numbers", "add", "sub", "mul", "div"].flatMap((t) => [1, 2, 3].map((l) => `${t}-${l}`));
  const passedLevels = levels.filter((id) => (p.quizzes[id]?.bestPct ?? 0) >= 60).length;
  return { done: passedLevels + Math.min(10, p.groupsSeen.length) + Math.min(4, p.lessonsSeen.length), total: levels.length + 10 + 4 };
}

/** Picture puzzles: the level-1 Bangla-math quizzes, which are built from counted pictures. */
export const MATH_PUZZLES: { id: string; title: string; icon: string; description: string; href: string }[] = [
  { id: "numbers-1", title: "ছবি গুনে সংখ্যা", icon: "🍎", description: "কয়টা ফল? গুনে বলো।", href: "/bangla-math/quiz/numbers-1" },
  { id: "add-1", title: "ছবির যোগ", icon: "➕", description: "দুই দল মিলিয়ে কয়টা হলো?", href: "/bangla-math/quiz/add-1" },
  { id: "sub-1", title: "ছবির বিয়োগ", icon: "➖", description: "কয়েকটা চলে গেলে কয়টা থাকে?", href: "/bangla-math/quiz/sub-1" },
  { id: "mul-1", title: "ছবির গুণ", icon: "✖️", description: "দলে দলে সাজানো ছবি গুনি।", href: "/bangla-math/quiz/mul-1" },
  { id: "div-1", title: "ছবির ভাগ", icon: "➗", description: "সবাই সমান ভাগ পাবে।", href: "/bangla-math/quiz/div-1" },
];

/** Where a hub quiz returns to when the child leaves or finishes. */
export function quizBackHref(quizId: string): string {
  if (quizId.startsWith("poem-")) return `${HUB}/poems/${quizId.slice(5)}`;
  if (quizId.startsWith("story-")) return `${HUB}/stories/${quizId.slice(6)}`;
  for (const f of FOLDERS) for (const s of f.sections) if (s.items.includes(`quiz:${quizId}`)) return s.href;
  return HUB;
}

/** The section a hub quiz belongs to (for its title/icon), if any. */
export function quizSection(quizId: string): HubSection | undefined {
  for (const f of FOLDERS) for (const s of f.sections) if (s.items.includes(`quiz:${quizId}`) && s.id !== "all") return s;
  return undefined;
}
