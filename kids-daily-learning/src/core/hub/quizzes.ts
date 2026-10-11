/**
 * Learning Hub quizzes. Each builder returns ordinary engine Questions, so the
 * shared QuizRunner/QuestionView/scoring run them unchanged.
 *
 * Question ids are stable for the same content (e.g. "bnc.find.ক"), so the
 * star for a question is earned once no matter how often a quiz is replayed.
 */
import type { Question } from "../types";
import { createRng, type Rng } from "../engine/util";
import { ALL_BN_LETTERS, BN_EXTRA_WORDS, BN_SENTENCES, VOWELS } from "./bangla";
import { ALPHABET, EN_SENTENCES, SPELLING_WORDS } from "./english";
import { findPoem } from "./poems";
import { findHubStory } from "./stories";

export interface HubQuiz { id: string; title: string; lang: "bn" | "en"; questions: Question[] }

function pickN<T>(rng: Rng, items: readonly T[], n: number): T[] {
  return rng.shuffle(items).slice(0, n);
}

/** A multiple-choice question whose options are shuffled and de-duplicated. */
function mcQ(id: string, prompt: string, correct: string, distractors: string[], explain: string, rng: Rng, visual?: string, speak?: string): Question {
  const set = [correct, ...distractors.filter((d) => d !== correct)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  const options = rng.shuffle(set);
  return { id, type: "mc", prompt, options, answer: options.indexOf(correct), explain, visual, speak };
}

/** Picture choice. Labels equal the emoji so the answer word isn't printed under the pictures. */
function imgQ(id: string, prompt: string, correct: string, distractors: string[], explain: string, rng: Rng, speak?: string): Question {
  const set = [correct, ...distractors.filter((d) => d !== correct)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  const opts = rng.shuffle(set);
  return { id, type: "image", prompt, options: opts.map((e) => ({ emoji: e, label: e })), answer: opts.indexOf(correct), explain, speak };
}

const others = <T,>(all: readonly T[], not: T, rng: Rng, n: number) => pickN(rng, all.filter((x) => x !== not), n);

// ---------------------------------------------------------------- বাংলা

function bnChena(rng: Rng): Question[] {
  const qs: Question[] = [];
  for (const L of pickN(rng, ALL_BN_LETTERS, 4)) {
    qs.push(mcQ(`bnc.find.${L.letter}`, `এর মধ্যে ‘${L.letter}’ কোনটি?`, L.letter, others(ALL_BN_LETTERS, L, rng, 3).map((x) => x.letter),
      `${L.letter} দিয়ে ${L.word} ${L.emoji}`, rng, undefined, `${L.letter} কোনটি?`));
  }
  const pairs = pickN(rng, ALL_BN_LETTERS, 4);
  qs.push({ id: `bnc.match.${pairs.map((p) => p.letter).join("")}`, type: "match", prompt: "অক্ষরের সাথে ছবির শব্দ মেলাও।",
    pairs: pairs.map((p) => [p.letter, `${p.emoji} ${p.word}`] as [string, string]), explain: pairs.map((p) => `${p.letter} — ${p.word}`).join(", ") });
  const v = rng.pick(VOWELS);
  qs.push(mcQ(`bnc.kind.${v.letter}`, `‘${v.letter}’ কোন ধরনের বর্ণ?`, "স্বরবর্ণ", ["ব্যঞ্জনবর্ণ"], `${v.letter} একটি স্বরবর্ণ। স্বরবর্ণ মোট ১১টি।`, rng));
  return qs;
}

function bnShobdo(rng: Rng): Question[] {
  const words = [...ALL_BN_LETTERS.filter((l) => !l.note).map((l) => ({ word: l.word, emoji: l.emoji })), ...BN_EXTRA_WORDS];
  const qs: Question[] = [];
  for (const w of pickN(rng, words, 3)) {
    qs.push(mcQ(`bns.name.${w.word}`, "ছবিটির নাম কী?", w.word, others(words, w, rng, 3).map((x) => x.word), `ছবিটি ${w.word}।`, rng, w.emoji));
  }
  for (const w of pickN(rng, words, 3)) {
    qs.push(imgQ(`bns.pic.${w.word}`, `‘${w.word}’ কোন ছবিটি?`, w.emoji, others(words, w, rng, 3).map((x) => x.emoji), `${w.emoji} — ${w.word}`, rng, `${w.word} কোন ছবিটি?`));
  }
  return qs;
}

function bnBakko(rng: Rng): Question[] {
  const qs: Question[] = [];
  for (const s of pickN(rng, BN_SENTENCES.filter((x) => x.words.length >= 3), 3)) {
    qs.push({ id: `bnb.order.${s.id}`, type: "order", prompt: "শব্দগুলো সাজিয়ে বাক্য বানাও।", items: s.words, sentence: true, explain: `ঠিক বাক্য: ${s.text}`, visual: s.emoji });
  }
  for (const s of pickN(rng, BN_SENTENCES, 2)) {
    qs.push(mcQ(`bnb.pic.${s.id}`, "কোন বাক্যটি ছবির সাথে মেলে?", s.text, others(BN_SENTENCES, s, rng, 2).map((x) => x.text), `ছবির সাথে মেলে: ${s.text}`, rng, s.emoji));
  }
  return qs;
}

// ---------------------------------------------------------------- English

function enAbc(rng: Rng): Question[] {
  return pickN(rng, ALPHABET, 5).map((L) =>
    mcQ(`ena.first.${L.upper}`, `What is the first letter of ${L.word}?`, L.upper, others(ALPHABET, L, rng, 3).map((x) => x.upper),
      `${L.word} starts with ${L.upper}. (${L.word} = ${L.bn})`, rng, L.emoji));
}

function enCase(rng: Rng): Question[] {
  const pairs = pickN(rng, ALPHABET, 5);
  const qs: Question[] = [{ id: `enc.match.${pairs.map((p) => p.upper).join("")}`, type: "match", prompt: "Match the big letters with the small letters.",
    pairs: pairs.map((p) => [p.upper, p.lower] as [string, string]), explain: pairs.map((p) => `${p.upper} → ${p.lower}`).join(", ") }];
  for (const L of pickN(rng, ALPHABET, 3)) {
    qs.push(mcQ(`enc.small.${L.upper}`, `Which is the small letter of ${L.upper}?`, L.lower, others(ALPHABET, L, rng, 3).map((x) => x.lower), `Big ${L.upper}, small ${L.lower}.`, rng));
  }
  const L = rng.pick(ALPHABET);
  qs.push(mcQ(`enc.big.${L.lower}`, `Which is the big (capital) letter of ${L.lower}?`, L.upper, others(ALPHABET, L, rng, 3).map((x) => x.upper), `Small ${L.lower}, big ${L.upper}.`, rng));
  return qs;
}

function enPhonics(rng: Rng): Question[] {
  // Letters whose sound is unambiguous at the start of their word.
  const clear = ALPHABET.filter((x) => !["C", "K", "Q", "X", "U", "O"].includes(x.upper));
  const qs: Question[] = [];
  for (const L of pickN(rng, clear, 3)) {
    qs.push(imgQ(`enp.pic.${L.upper}`, `Which picture starts with the ${L.sound} sound?`, L.emoji, others(clear, L, rng, 2).map((x) => x.emoji),
      `${L.word} starts with ${L.sound} (${L.soundBn}).`, rng, `Which picture starts with the ${L.sound.replace(/\//g, "")} sound?`));
  }
  for (const L of pickN(rng, clear, 2)) {
    qs.push(mcQ(`enp.sound.${L.upper}`, `${L.word} starts with which sound?`, L.sound, others(clear, L, rng, 2).map((x) => x.sound), `${L.word}: ${L.sound} — বাংলায় ${L.soundBn}`, rng, L.emoji));
  }
  return qs;
}

function enWords(rng: Rng): Question[] {
  const qs: Question[] = [];
  for (const L of pickN(rng, ALPHABET, 3)) qs.push(mcQ(`enw.name.${L.word}`, "What is this?", L.word, others(ALPHABET, L, rng, 3).map((x) => x.word), `This is ${L.word === "Insect" ? "an insect" : `a ${L.word.toLowerCase()}`}. বাংলায়: ${L.bn}`, rng, L.emoji));
  for (const L of pickN(rng, ALPHABET, 2)) qs.push(mcQ(`enw.bn.${L.word}`, `What is ‘${L.bn}’ in English?`, L.word, others(ALPHABET, L, rng, 3).map((x) => x.word), `${L.bn} = ${L.word}`, rng));
  return qs;
}

function enSpelling(rng: Rng): Question[] {
  const qs: Question[] = [];
  for (const w of pickN(rng, SPELLING_WORDS, 3)) {
    qs.push({ id: `ens.type.${w.word}`, type: "type", prompt: "Spell the word.", visual: w.emoji, accept: [w.word], inputMode: "text", placeholder: "Type here", explain: `${w.emoji} is spelled ${w.word.toUpperCase().split("").join("-")} (${w.bn}).`, speak: `Spell ${w.word}` });
  }
  for (const w of pickN(rng, SPELLING_WORDS.filter((x) => x.word.length >= 3), 2)) {
    const i = 1 + rng.int(0, w.word.length - 2);
    const missing = w.word[i];
    const shown = `${w.word.slice(0, i)}_${w.word.slice(i + 1)}`;
    // Vowel gap → consonant distractors and vice versa, so only one choice makes a real word.
    const letters = ("aeiou".includes(missing) ? "bcdfghklmnprst" : "aeiou").split("").filter((c) => c !== missing);
    qs.push(mcQ(`ens.miss.${w.word}.${i}`, `Which letter is missing? ${shown}`, missing, pickN(rng, letters, 3), `${shown} → ${w.word}`, rng, w.emoji));
  }
  return qs;
}

function enReading(rng: Rng): Question[] {
  const qs: Question[] = [];
  for (const s of pickN(rng, EN_SENTENCES, 3)) {
    qs.push({ id: `enr.order.${s.id}`, type: "order", prompt: "Put the words in order to make a sentence.", items: s.words, sentence: true, explain: `${s.text} (${s.bn})`, visual: s.emoji });
  }
  for (const s of pickN(rng, EN_SENTENCES, 2)) {
    qs.push(mcQ(`enr.pic.${s.id}`, "Which sentence matches the picture?", s.text, others(EN_SENTENCES, s, rng, 2).map((x) => x.text), `${s.text} — ${s.bn}`, rng, s.emoji));
  }
  return qs;
}

// ---------------------------------------------------------------- registry

const BUILDERS: Record<string, { title: string; lang: "bn" | "en"; build: (rng: Rng) => Question[] }> = {
  "bn-chena": { title: "অক্ষর চেনার খেলা", lang: "bn", build: bnChena },
  "bn-shobdo": { title: "ছবি দেখে শব্দ", lang: "bn", build: bnShobdo },
  "bn-bakko": { title: "বাক্য বানাই", lang: "bn", build: bnBakko },
  "en-abc": { title: "ABC Quiz", lang: "en", build: enAbc },
  "en-case": { title: "Big & Small Letters", lang: "en", build: enCase },
  "en-phonics": { title: "Phonics Fun", lang: "en", build: enPhonics },
  "en-words": { title: "Picture Words", lang: "en", build: enWords },
  "en-spelling": { title: "Spelling Bee", lang: "en", build: enSpelling },
  "en-reading": { title: "Reading Practice", lang: "en", build: enReading },
};

export const GENERATED_QUIZ_IDS = Object.keys(BUILDERS);

/** "bn-chena" | "poem-<id>" | "story-<id>" */
export function buildHubQuiz(id: string, seed: string | number): HubQuiz | null {
  const b = BUILDERS[id];
  if (b) return { id, title: b.title, lang: b.lang, questions: b.build(createRng(`${id}|${seed}`)) };
  if (id.startsWith("poem-")) {
    const p = findPoem(id.slice(5));
    return p ? { id, title: p.title, lang: "bn", questions: p.questions } : null;
  }
  if (id.startsWith("story-")) {
    const s = findHubStory(id.slice(6));
    return s ? { id, title: s.title, lang: s.lang, questions: s.questions } : null;
  }
  return null;
}

export function isHubQuizId(id: string): boolean {
  return id in BUILDERS
    || (id.startsWith("poem-") && !!findPoem(id.slice(5)))
    || (id.startsWith("story-") && !!findHubStory(id.slice(6)));
}

