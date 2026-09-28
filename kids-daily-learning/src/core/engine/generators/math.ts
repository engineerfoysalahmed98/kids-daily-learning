import type { Level, Question } from "../../types";
import { type Rng, uniqueOptions } from "../util";

const OBJECTS = ["🍎", "⭐", "🐞", "🎈", "🍪", "🐟", "🌸", "🚗"];
const NAMES = ["Ayaan", "Maya", "Leo", "Zara", "Omar", "Mia", "Kai", "Nora"];
const THINGS = ["stickers", "marbles", "shells", "crayons", "books", "apples"];

export const MATH_TITLES: Record<Level, { title: string; description: string }> = {
  1: { title: "Counting Fun", description: "Count, compare and order numbers to 20" },
  2: { title: "Addition Challenge", description: "Fun addition and take-away puzzles" },
  3: { title: "Number Ninja", description: "Bigger sums and times tables" },
  4: { title: "Multiply & Divide", description: "Times tables, sharing and shapes" },
  5: { title: "Fraction Quest", description: "Fractions, area and word problems" },
};

/** Plausible wrong answers close to the right one (never negative). */
function near(n: number, rng: Rng, min = 0): number[] {
  const candidates = [n + 1, n - 1, n + 2, n - 2, n + 10, n - 10, n + 3];
  return rng.shuffle(candidates.filter((v) => v >= min && v !== n));
}

function mcNum(id: string, prompt: string, answer: number, rng: Rng, explain: string, visual?: string): Question {
  const { options, answer: idx } = uniqueOptions(answer, near(answer, rng), 3, rng);
  return { id, type: "mc", prompt, options, answer: idx, explain, visual };
}

function typeNum(id: string, prompt: string, answer: number | string, explain: string, visual?: string): Question {
  return { id, type: "type", prompt, accept: [String(answer)], inputMode: "numeric", explain, visual, placeholder: "Type a number" };
}

function countOn(a: number, b: number): string {
  if (b > 5) return `Start at ${a} and count on ${b} more. You land on ${a + b}!`;
  const steps = Array.from({ length: b }, (_, i) => a + i + 1).join("… ");
  return `Start at ${a} and count on: ${steps}. So ${a} + ${b} = ${a + b}!`;
}

type Gen = (id: string, rng: Rng) => Question;

const L1: Gen[] = [
  (id, rng) => {
    const n = rng.int(3, 10);
    const o = rng.pick(OBJECTS);
    return typeNum(id, `How many ${o} can you count?`, n, `Point and count each one: there are ${n}.`, o.repeat(n));
  },
  (id, rng) => {
    const a = rng.int(1, 19);
    return typeNum(id, `What number comes right after ${a}?`, a + 1, `When we count, ${a + 1} comes right after ${a}.`);
  },
  (id, rng) => {
    const a = rng.int(1, 15);
    let b = rng.int(1, 15);
    if (b === a) b = a + 3;
    const big = Math.max(a, b);
    return { id, type: "mc", prompt: "Which number is bigger?", options: [String(a), String(b)], answer: a > b ? 0 : 1, explain: `${big} is bigger — it comes later when we count.` };
  },
  (id, rng) => {
    const a = rng.int(1, 4);
    const b = rng.int(1, 4);
    const o = rng.pick(OBJECTS);
    return mcNum(id, `${o.repeat(a)} + ${o.repeat(b)} = ?`, a + b, rng, countOn(a, b));
  },
  (id, rng) => {
    const start = rng.int(1, 12);
    const nums = rng.shuffle([start, start + 2, start + 5, start + 7]).map(String);
    const sorted = nums.slice().sort((x, y) => Number(x) - Number(y));
    return { id, type: "order", prompt: "Put the numbers in order, smallest first.", items: sorted, explain: `Smallest to biggest: ${sorted.join(", ")}.` };
  },
];

const L2: Gen[] = [
  (id, rng) => {
    const a = rng.int(2, 12);
    const b = rng.int(2, 8);
    return typeNum(id, `${a} + ${b} = ?`, a + b, countOn(a, b));
  },
  (id, rng) => {
    const a = rng.int(5, 15);
    const b = rng.int(1, 5);
    return mcNum(id, `${a} + ${b} = ?`, a + b, rng, countOn(a, b));
  },
  (id, rng) => {
    const a = rng.int(5, 10);
    const b = rng.int(1, a - 1);
    return typeNum(id, `${a} − ${b} = ?`, a - b, `Start at ${a} and count back ${b}. You get ${a - b}.`);
  },
  (id, rng) => {
    const total = 10;
    const a = rng.int(2, 8);
    return typeNum(id, `${a} + ? = ${total}`, total - a, `${a} and ${total - a} are friends that make 10!`);
  },
  (id, rng) => {
    const name = rng.pick(NAMES);
    const thing = rng.pick(THINGS);
    const a = rng.int(3, 9);
    const b = rng.int(2, 8);
    return mcNum(id, `${name} has ${a} ${thing}. A friend gives ${b} more. How many now?`, a + b, rng, `Adding means putting together: ${a} + ${b} = ${a + b}.`, "🎁");
  },
  (id, rng) => {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const truth = rng.next() < 0.5;
    const shown = truth ? a + b : a + b + (rng.next() < 0.5 ? 1 : -1);
    return { id, type: "tf", prompt: `True or false? ${a} + ${b} = ${shown}`, answer: truth, explain: `${a} + ${b} really equals ${a + b}.` };
  },
];

const L3: Gen[] = [
  (id, rng) => {
    const a = rng.int(12, 60);
    const b = rng.int(11, 39);
    return typeNum(id, `${a} + ${b} = ?`, a + b, `Add the tens: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${(Math.floor(a / 10) + Math.floor(b / 10)) * 10}. Then the ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. Together: ${a + b}.`);
  },
  (id, rng) => {
    const a = rng.int(40, 99);
    const b = rng.int(10, a - 10);
    return mcNum(id, `${a} − ${b} = ?`, a - b, rng, `Take away the tens first, then the ones: ${a} − ${b} = ${a - b}.`);
  },
  (id, rng) => {
    const t = rng.pick([2, 5, 10]);
    const n = rng.int(2, 10);
    return typeNum(id, `${t} × ${n} = ?`, t * n, `${t} × ${n} means ${n} groups of ${t}. Skip count by ${t}: you reach ${t * n}.`);
  },
  (id, rng) => {
    const g = rng.int(2, 5);
    const each = rng.int(2, 5);
    const o = rng.pick(OBJECTS);
    return mcNum(id, `${g} bags with ${each} ${o} in each. How many in all?`, g * each, rng, `${g} groups of ${each} = ${g} × ${each} = ${g * each}.`, o);
  },
  (id, rng) => {
    const step = rng.pick([2, 5, 10]);
    const start = step * rng.int(1, 4);
    const items = [0, 1, 2, 3].map((i) => String(start + step * i));
    return { id, type: "order", prompt: `Skip count by ${step}s — put them in order.`, items, explain: `Each number is ${step} more than the one before.` };
  },
  (id, rng) => {
    const name = rng.pick(NAMES);
    const a = rng.int(20, 50);
    const b = rng.int(5, 19);
    return typeNum(id, `${name} read ${a} pages on Monday and ${b} pages on Tuesday. How many pages in total?`, a + b, `${a} + ${b} = ${a + b} pages.`, "📚");
  },
];

const L4: Gen[] = [
  (id, rng) => {
    const a = rng.int(3, 12);
    const b = rng.int(3, 12);
    return typeNum(id, `${a} × ${b} = ?`, a * b, `${a} × ${b} = ${a * b}. Tip: ${b} × ${a} is the same!`);
  },
  (id, rng) => {
    const d = rng.int(2, 9);
    const q = rng.int(2, 10);
    return mcNum(id, `${d * q} ÷ ${d} = ?`, q, rng, `Share ${d * q} into ${d} equal groups: each gets ${q}, because ${d} × ${q} = ${d * q}.`);
  },
  (id, rng) => {
    const l = rng.int(3, 12);
    const w = rng.int(2, 8);
    return typeNum(id, `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter (in cm)?`, 2 * (l + w), `Perimeter is the distance around: ${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} cm.`, "▭");
  },
  (id, rng) => {
    const n = rng.int(11, 99);
    const r = Math.round(n / 10) * 10;
    return mcNum(id, `Round ${n} to the nearest 10.`, r, rng, `${n} is closer to ${r}. If the ones digit is 5 or more, round up.`);
  },
  (id, rng) => {
    const packs = rng.int(3, 8);
    const per = rng.int(4, 9);
    const eaten = rng.int(1, per);
    return typeNum(id, `There are ${packs} packs with ${per} crackers each. The class eats ${eaten}. How many are left?`, packs * per - eaten, `First multiply: ${packs} × ${per} = ${packs * per}. Then subtract ${eaten}: ${packs * per - eaten}.`, "🍘");
  },
  (id, rng) => {
    const a = rng.int(3, 9);
    const b = rng.int(3, 9);
    const truth = rng.next() < 0.5;
    const shown = truth ? a * b : a * b + rng.pick([-2, -1, 1, 2]);
    return { id, type: "tf", prompt: `True or false? ${a} × ${b} = ${shown}`, answer: truth, explain: `${a} × ${b} = ${a * b}.` };
  },
];

const L5: Gen[] = [
  (id, rng) => {
    const den = rng.pick([2, 3, 4, 5]);
    const whole = den * rng.int(3, 10);
    return typeNum(id, `What is 1/${den} of ${whole}?`, whole / den, `Split ${whole} into ${den} equal parts: ${whole} ÷ ${den} = ${whole / den}.`);
  },
  (id, rng) => {
    const den = rng.pick([6, 8, 10, 12]);
    const a = rng.int(1, den - 2);
    const b = rng.int(1, den - a - 1);
    return typeNum(id, `${a}/${den} + ${b}/${den} = ?/${den}`, a + b, `When the bottoms match, add the tops: ${a} + ${b} = ${a + b}, so ${a + b}/${den}.`);
  },
  (id, rng) => {
    const pairs: [number, number][] = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [2, 5]];
    const [n, d] = rng.pick(pairs);
    const k = rng.int(2, 4);
    const correct = `${n}/${d}`;
    const distract = [`${n * k}/${d}`, `${n}/${d * k}`, `${n + 1}/${d}`].filter((x) => x !== correct);
    const { options, answer } = uniqueOptions(correct, distract, 3, rng);
    return { id, type: "mc", prompt: `Simplify ${n * k}/${d * k}.`, options, answer, explain: `Divide top and bottom by ${k}: ${n * k}÷${k} = ${n}, ${d * k}÷${k} = ${d}. So it's ${correct}.` };
  },
  (id, rng) => {
    const opts: [string, string, string][] = [["1/2", "1/3", "Halves are bigger pieces than thirds."], ["3/4", "2/4", "Same bottom number — 3 pieces is more than 2."], ["2/3", "1/3", "2 out of 3 is more than 1 out of 3."], ["1/4", "1/8", "Fourths are bigger than eighths."]];
    const [big, small, why] = rng.pick(opts);
    const options = rng.shuffle([big, small]);
    return { id, type: "mc", prompt: "Which fraction is bigger?", options, answer: options.indexOf(big), explain: why, visual: "🍕" };
  },
  (id, rng) => {
    const l = rng.int(4, 12);
    const w = rng.int(3, 9);
    return typeNum(id, `A garden is ${l} m by ${w} m. What is its area in square meters?`, l * w, `Area = length × width = ${l} × ${w} = ${l * w} m².`, "🌷");
  },
  (id, rng) => {
    const items = ["1/8", "1/4", "1/2", "3/4"];
    void rng;
    return { id, type: "order", prompt: "Order these fractions from smallest to largest.", items, explain: "1/8 < 1/4 < 1/2 < 3/4. Imagine slices of the same pizza!" };
  },
  (id, rng) => {
    const price = rng.int(3, 9);
    const qty = rng.int(3, 6);
    const paid = Math.ceil((price * qty) / 10) * 10 + 10;
    return typeNum(id, `Notebooks cost $${price} each. You buy ${qty} and pay with $${paid}. How much change do you get?`, paid - price * qty, `Cost: ${qty} × $${price} = $${price * qty}. Change: $${paid} − $${price * qty} = $${paid - price * qty}.`, "📓");
  },
];

const BANK: Record<Level, Gen[]> = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 };

export function mathQuestions(level: Level, count: number, rng: Rng, idPrefix: string): Question[] {
  const gens = BANK[level];
  const order = rng.shuffle(gens.map((_, i) => i));
  const qs: Question[] = [];
  for (let i = 0; i < count; i++) {
    const g = gens[order[i % order.length]];
    qs.push(g(`${idPrefix}-${i}`, rng));
  }
  return qs;
}

/** Quick Math game: typed answers only, from one level. */
export function quickMathQuestions(level: Level, count: number, rng: Rng, idPrefix: string): Question[] {
  const qs: Question[] = [];
  for (let i = 0; i < count; i++) {
    let a: number, b: number, op: string, ans: number;
    if (level <= 2) { a = rng.int(1, 10); b = rng.int(1, 10); op = "+"; ans = a + b; }
    else if (level === 3) {
      if (rng.next() < 0.5) { a = rng.int(10, 50); b = rng.int(1, 30); op = "+"; ans = a + b; }
      else { a = rng.pick([2, 5, 10]); b = rng.int(2, 10); op = "×"; ans = a * b; }
    } else { a = rng.int(2, 12); b = rng.int(2, 12); op = "×"; ans = a * b; }
    qs.push(typeNum(`${idPrefix}-${i}`, `${a} ${op} ${b} = ?`, ans, `${a} ${op} ${b} = ${ans}.`));
  }
  return qs;
}
