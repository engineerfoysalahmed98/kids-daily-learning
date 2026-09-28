import type { LessonCard, Level, Question, VocabWord } from "../../types";
import { GRAMMAR } from "../../content/vocab";
import { type Rng, uniqueOptions } from "../util";

export const ENGLISH_TITLES: Record<Level, { title: string; description: string }> = {
  1: { title: "Letters & First Words", description: "Meet 5 picture words and their first letters" },
  2: { title: "Learn 5 New Words", description: "Discover 5 new describing words" },
  3: { title: "Word Builder", description: "5 new words plus a grammar puzzle" },
  4: { title: "Vocabulary Voyage", description: "5 powerful words and sentence building" },
  5: { title: "Word Master", description: "5 advanced words and tricky grammar" },
};

/** Picks 5 words for the day, rotating through the level's word list. */
export function pickWords(all: VocabWord[], level: Level, rotation: number, count = 5): VocabWord[] {
  let pool = all.filter((w) => w.level === level);
  if (pool.length < count) pool = all.filter((w) => Math.abs(w.level - level) <= 1);
  if (pool.length === 0) return [];
  const start = (rotation * count) % pool.length;
  const out: VocabWord[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) out.push(pool[(start + i) % pool.length]);
  return out;
}

export function wordCards(words: VocabWord[], level: Level): LessonCard[] {
  return words.map((w) =>
    level === 1
      ? { emoji: w.emoji, title: w.word, body: `${w.word} starts with the letter ${w.word[0].toUpperCase()}.`, example: w.example }
      : { emoji: w.emoji, title: w.word, body: w.meaning, example: w.example },
  );
}

export function englishQuestions(words: VocabWord[], level: Level, rng: Rng, idPrefix: string, allWords: VocabWord[]): Question[] {
  const qs: Question[] = [];
  const others = allWords.filter((w) => !words.includes(w));
  const id = (n: number) => `${idPrefix}-${n}`;
  if (words.length === 0) return qs;

  if (level === 1) {
    const [a, b, c, d] = words;
    // Image: which picture starts with letter X
    const opts = rng.shuffle([a, ...rng.shuffle(others.filter((o) => o.word[0] !== a.word[0])).slice(0, 2)]);
    qs.push({ id: id(0), type: "image", prompt: `Which picture starts with the letter ${a.word[0]}?`, options: opts.map((o) => ({ emoji: o.emoji, label: o.word })), answer: opts.indexOf(a), explain: `${a.word} starts with ${a.word[0]}. ${a.word[0]} is for ${a.word}!` });
    // MC letter
    const letters = uniqueOptions(b.word[0], rng.shuffle("ABCDEFGHMPST".split("").filter((l) => l !== b.word[0])), 3, rng);
    qs.push({ id: id(1), type: "mc", prompt: `What letter does this word start with?`, visual: b.emoji, speak: `What letter does ${b.word} start with?`, options: letters.options, answer: letters.answer, explain: `${b.word} starts with ${b.word[0]}.` });
    // Match word to picture
    qs.push({ id: id(2), type: "match", prompt: "Match each word to its picture.", pairs: [a, b, c].map((w) => [w.word, w.emoji] as [string, string]), explain: "Reading words and pictures together helps you remember them." });
    // Typed first letter
    qs.push({ id: id(3), type: "type", prompt: "Type the first letter of this word.", visual: `${d?.emoji ?? c.emoji}`, speak: `Type the first letter of ${d?.word ?? c.word}`, accept: [(d ?? c).word[0].toLowerCase()], inputMode: "text", placeholder: "One letter", explain: `${(d ?? c).word} starts with ${(d ?? c).word[0]}.` });
    // TF
    const e = words[4] ?? a;
    qs.push({ id: id(4), type: "tf", prompt: `${e.emoji} This is a ${e.word}. True or false?`, answer: true, explain: `Yes, that is a ${e.word}!` });
    return qs;
  }

  const [a, b, c, d, e] = words;
  // 1. Meaning MC
  const meaning = uniqueOptions(a.meaning, rng.shuffle(others).slice(0, 4).map((o) => o.meaning), 3, rng);
  qs.push({ id: id(0), type: "mc", prompt: `What does “${a.word}” mean?`, visual: a.emoji, options: meaning.options, answer: meaning.answer, explain: `${a.word} means: ${a.meaning.toLowerCase()} Example: ${a.example}` });
  // 2. Match words to meaning (or emoji for lower levels)
  const trio = [b, c, d ?? a];
  qs.push({ id: id(1), type: "match", prompt: level <= 3 ? "Match each word to its picture." : "Match each word to its meaning.", pairs: trio.map((w) => [w.word, level <= 3 ? w.emoji : w.meaning] as [string, string]), explain: "Matching words to pictures and meanings helps them stick." });
  // 3. Fill the blank
  const blankSentence = c.example.replace(new RegExp(c.word, "i"), "____");
  const blank = uniqueOptions(c.word.toLowerCase(), rng.shuffle([a, b, d, e].filter(Boolean)).map((w) => w!.word.toLowerCase()), 3, rng);
  qs.push({ id: id(2), type: "mc", prompt: `Fill the blank: “${blankSentence}”`, options: blank.options, answer: blank.answer, explain: `The sentence is: “${c.example}”` });
  // 4. Spelling
  const sp = e ?? b;
  qs.push({ id: id(3), type: "type", prompt: `Spell the word that means: “${sp.meaning}”`, visual: sp.emoji, accept: [sp.word.toLowerCase()], inputMode: "text", placeholder: "Type the word", explain: `The word is ${sp.word}: ${sp.word.split("").join("-").toUpperCase()}.` });

  // 5. Grammar by level
  if (level === 2) {
    const [one, many] = rng.pick(GRAMMAR.plurals.slice(0, 3));
    const pl = uniqueOptions(many, [one + "es", one + "s", one + "ies"].filter((x) => x !== many), 3, rng);
    qs.push({ id: id(4), type: "mc", prompt: `One ${one}, two …`, options: pl.options, answer: pl.answer, explain: `We say one ${one}, two ${many}.` });
  } else if (level === 3) {
    const g = rng.pick(GRAMMAR.nounsVerbs);
    const words3 = g.sentence.replace(".", "").split(" ");
    const opts = uniqueOptions(g.verb, words3.filter((w) => w !== g.verb && w.length > 2), 3, rng);
    qs.push({ id: id(4), type: "mc", prompt: `Which word is the action (verb)? “${g.sentence}”`, options: opts.options, answer: opts.answer, explain: `“${g.verb}” is what the ${g.noun} does, so it is the verb.` });
  } else if (level === 4) {
    const s = rng.pick(GRAMMAR.sentences.slice(0, 5));
    qs.push({ id: id(4), type: "order", prompt: "Build the sentence — put the words in order.", items: s.split(" "), sentence: true, explain: `The sentence is: “${s}.”` });
  } else {
    const p = rng.pick(GRAMMAR.punctuation);
    const opts = rng.shuffle([".", "?", "!"]);
    qs.push({ id: id(4), type: "mc", prompt: `Which mark ends this sentence? “${p.text}___”`, options: opts, answer: opts.indexOf(p.mark), explain: p.mark === "?" ? "It asks something, so it needs a question mark." : p.mark === "!" ? "It shows strong feeling, so it needs an exclamation mark." : "It tells something, so it ends with a full stop." });
    const [x, y] = rng.pick(GRAMMAR.opposites);
    qs.push({ id: id(5), type: "type", prompt: `Type the opposite of “${x}”.`, accept: [y, ...(y === "quiet" ? ["silent"] : []), ...(y === "small" ? ["little", "tiny"] : [])], inputMode: "text", placeholder: "Type a word", explain: `The opposite of ${x} is ${y}.` });
  }
  return qs;
}

/** Word Match mini-game: 4 match rounds from the child's level. */
export function wordMatchQuestions(all: VocabWord[], level: Level, rng: Rng, idPrefix: string): Question[] {
  const pool = rng.shuffle(all.filter((w) => Math.abs(w.level - level) <= 1));
  const qs: Question[] = [];
  for (let r = 0; r < 4 && pool.length >= (r + 1) * 3; r++) {
    const set = pool.slice(r * 3, r * 3 + 3);
    qs.push({ id: `${idPrefix}-${r}`, type: "match", prompt: "Match each word to its picture.", pairs: set.map((w) => [w.word, w.emoji] as [string, string]), explain: set.map((w) => `${w.emoji} ${w.word}`).join(" · ") });
  }
  return qs;
}
