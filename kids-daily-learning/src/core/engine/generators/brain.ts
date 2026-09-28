import type { Level, Question } from "../../types";
import { type Rng, uniqueOptions } from "../util";

const SETS = [
  ["🔴", "🔵", "🟡", "🟢"],
  ["🍎", "🍌", "🍇", "🍊"],
  ["🐶", "🐱", "🐰", "🐻"],
  ["⭐", "🌙", "☀️", "☁️"],
  ["🚗", "🚲", "🚀", "⛵"],
];

const ODD_ONE_OUT: { items: [string, string][]; odd: number; why: string }[] = [
  { items: [["🍎", "Apple"], ["🍌", "Banana"], ["🚗", "Car"], ["🍇", "Grapes"]], odd: 2, why: "A car is not a fruit." },
  { items: [["🐶", "Dog"], ["🐱", "Cat"], ["🐰", "Rabbit"], ["🌳", "Tree"]], odd: 3, why: "A tree is a plant, not an animal." },
  { items: [["🚲", "Bike"], ["🚌", "Bus"], ["🍕", "Pizza"], ["🚂", "Train"]], odd: 2, why: "Pizza is food — the others help us travel." },
  { items: [["🐟", "Fish"], ["🐙", "Octopus"], ["🐬", "Dolphin"], ["🐫", "Camel"]], odd: 3, why: "A camel lives in the desert; the others live in water." },
  { items: [["🔺", "Triangle"], ["⚪", "Circle"], ["🟥", "Square"], ["🍩", "Donut"]], odd: 3, why: "A donut is a snack, not a shape." },
  { items: [["🎻", "Violin"], ["🥁", "Drum"], ["🎸", "Guitar"], ["⚽", "Ball"]], odd: 3, why: "A ball is not a musical instrument." },
];

type Gen = (id: string, rng: Rng) => Question;

const colorPattern = (len: number, kind: "AB" | "AAB" | "ABC"): Gen => (id, rng) => {
  const set = rng.pick(SETS);
  const [a, b, c] = rng.shuffle(set);
  const unit = kind === "AB" ? [a, b] : kind === "AAB" ? [a, a, b] : [a, b, c];
  const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
  const answer = unit[len % unit.length];
  const opts = rng.shuffle([a, b, c].filter((x, i, arr) => arr.indexOf(x) === i));
  return {
    id, type: "image", prompt: "What comes next in the pattern?",
    visual: `${seq.join(" ")} ❓`,
    options: opts.map((e) => ({ emoji: e, label: e })), answer: opts.indexOf(answer),
    explain: `The pattern repeats: ${unit.join(" ")}. So next is ${answer}.`,
  };
};

const numberPattern = (step: (n: number, i: number) => number, rule: string, start: [number, number]): Gen => (id, rng) => {
  let n = rng.int(start[0], start[1]);
  const seq: number[] = [];
  for (let i = 0; i < 5; i++) { seq.push(n); n = step(n, i); }
  const answer = seq[4];
  const shown = seq.slice(0, 4);
  const o = uniqueOptions(answer, [answer + 1, answer - 1, answer + 2, seq[3] + 1], 3, rng);
  return { id, type: "mc", prompt: `What comes next? ${shown.join(", ")}, …`, options: o.options, answer: o.answer, explain: `The rule is: ${rule}. So the next number is ${answer}.` };
};

const oddOneOut: Gen = (id, rng) => {
  const q = rng.pick(ODD_ONE_OUT);
  return { id, type: "image", prompt: "Which one does not belong?", options: q.items.map(([emoji, label]) => ({ emoji, label })), answer: q.odd, explain: q.why };
};

const sizeOrder: Gen = (id, rng) => {
  const sets = [["🐭 Mouse", "🐱 Cat", "🐶 Dog", "🐘 Elephant"], ["🐜 Ant", "🐸 Frog", "🐑 Sheep", "🦒 Giraffe"], ["🫐 Blueberry", "🍎 Apple", "🍉 Watermelon", "🎃 Pumpkin"]];
  const items = rng.pick(sets.slice(0, 2));
  return { id, type: "order", prompt: "Put them in order from smallest to biggest.", items, explain: `Smallest to biggest: ${items.join(", ")}.` };
};

const heightLogic: Gen = (id, rng) => {
  const names = rng.shuffle(["Tom", "Sara", "Ali", "Mia", "Ben"]).slice(0, 3);
  const [tall, mid, short] = names;
  const opts = rng.shuffle(names);
  return { id, type: "mc", prompt: `${tall} is taller than ${mid}. ${mid} is taller than ${short}. Who is the shortest?`, options: opts, answer: opts.indexOf(short), explain: `${tall} > ${mid} > ${short}, so ${short} is the shortest.`, visual: "📏" };
};

const syllogism: Gen = (id, rng) => {
  const q = rng.pick([
    { p: "All bloops are green. Zip is a bloop.", q: "Is Zip green?", a: true, why: "Every bloop is green, and Zip is a bloop — so Zip is green." },
    { p: "Every glim can swim. Fluff cannot swim.", q: "Is Fluff a glim?", a: false, why: "If Fluff were a glim, Fluff could swim. Fluff can't, so Fluff is not a glim." },
    { p: "Some birds cannot fly. A penguin is a bird.", q: "Does that prove a penguin can fly?", a: false, why: "Being a bird doesn't prove it can fly — some birds can't." },
  ]);
  return { id, type: "tf", prompt: `${q.p} ${q.q}`, answer: q.a, explain: q.why, visual: "🧩" };
};

const codeBreaker: Gen = (id, rng) => {
  const shift = rng.int(1, 3);
  const word = rng.pick(["CAT", "SUN", "DOG", "HAT", "BEE"]);
  const coded = word.split("").map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65)).join("");
  return { id, type: "type", prompt: `Secret code! Each letter moved ${shift} step${shift > 1 ? "s" : ""} forward in the alphabet. “${coded}” is really…?`, accept: [word.toLowerCase()], inputMode: "text", placeholder: "Type the word", explain: `Move each letter ${shift} back: ${coded} → ${word}.`, visual: "🔐" };
};

const BANK: Record<Level, Gen[]> = {
  1: [colorPattern(5, "AB"), colorPattern(5, "AB"), oddOneOut, sizeOrder, numberPattern((n) => n + 1, "add 1 each time", [1, 5])],
  2: [colorPattern(6, "AAB"), colorPattern(5, "AB"), oddOneOut, sizeOrder, numberPattern((n) => n + 2, "add 2 each time", [2, 10])],
  3: [colorPattern(6, "ABC"), numberPattern((n) => n + 5, "add 5 each time", [5, 20]), oddOneOut, heightLogic, numberPattern((n) => n + 10, "add 10 each time", [10, 40])],
  4: [numberPattern((n) => n * 2, "double each time", [1, 3]), heightLogic, codeBreaker, numberPattern((n) => n + 3, "add 3 each time", [1, 10]), colorPattern(7, "ABC")],
  5: [numberPattern((n, i) => n + (i + 1) * 2, "add 2, then 4, then 6, then 8", [1, 5]), syllogism, codeBreaker, heightLogic, numberPattern((n) => n * 3, "multiply by 3 each time", [1, 2])],
};

export function brainQuestions(level: Level, rng: Rng, idPrefix: string, count = 5): Question[] {
  const gens = BANK[level];
  return Array.from({ length: count }, (_, i) => gens[i % gens.length](`${idPrefix}-${i}`, rng));
}
