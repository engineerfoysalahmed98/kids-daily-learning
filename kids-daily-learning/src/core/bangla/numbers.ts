/**
 * Bangla numbers ১–১০০: numerals, Bangla names and English names.
 * Pure data + helpers (no React) so the engine, UI and tests share one source.
 *
 * Spellings follow the common Bangla Academy / textbook forms
 * (e.g. ঊনত্রিশ, ঊনচল্লিশ, একশো).
 */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

/** 27 → "২৭". Works for any non-negative integer (and leaves other characters alone). */
export function toBn(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** "২৭" → 27; also accepts Western digits ("27") and mixed spacing. NaN if not a whole number. */
export function fromBn(text: string): number {
  const western = text.trim().replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d as (typeof BN_DIGITS)[number])));
  return /^\d+$/.test(western) ? Number(western) : Number.NaN;
}

/** Bangla number names, index = number (index 0 unused). */
const BN_NAMES: readonly string[] = [
  "শূন্য",
  "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ",
  "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ",
  "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আটাশ", "ঊনত্রিশ", "ত্রিশ",
  "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ", "চল্লিশ",
  "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ", "পঞ্চাশ",
  "একান্ন", "বাহান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট", "ষাট",
  "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর", "সত্তর",
  "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি", "আশি",
  "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "অষ্টাশি", "ঊননব্বই", "নব্বই",
  "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই", "একশো",
];

const EN_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

export const MIN_NUMBER = 1;
export const MAX_NUMBER = 100;

export function inRange(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= MAX_NUMBER;
}

/** 27 → "সাতাশ" (0–100). */
export function bnName(n: number): string {
  if (!inRange(n)) throw new RangeError(`bnName supports 0–100, got ${n}`);
  return BN_NAMES[n];
}

/** 27 → "twenty-seven" (0–100). */
export function enName(n: number): string {
  if (!inRange(n)) throw new RangeError(`enName supports 0–100, got ${n}`);
  if (n === 100) return "one hundred";
  if (n < 20) return EN_ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${EN_TENS[t]}-${EN_ONES[o]}` : EN_TENS[t];
}

export interface NumberInfo {
  n: number;
  bn: string; // "২৭"
  bnName: string; // "সাতাশ"
  en: string; // "27"
  enName: string; // "twenty-seven"
  tens: number;
  ones: number;
}

export function numberInfo(n: number): NumberInfo {
  return { n, bn: toBn(n), bnName: bnName(n), en: String(n), enName: enName(n), tens: Math.floor(n / 10), ones: n % 10 };
}

export const NUMBERS: NumberInfo[] = Array.from({ length: MAX_NUMBER }, (_, i) => numberInfo(i + 1));

/** Ten groups: ১–১০, ১১–২০ … ৯১–১০০. Group ids are 1–10. */
export interface NumberGroup {
  id: number;
  from: number;
  to: number;
  title: string; // "১ থেকে ১০"
  emoji: string;
}

const GROUP_EMOJI = ["🥭", "🍌", "🌸", "🧸", "⚽", "🐟", "🎈", "🐦", "⭐", "💯"];

export const NUMBER_GROUPS: NumberGroup[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  from: i * 10 + 1,
  to: i * 10 + 10,
  title: `${toBn(i * 10 + 1)} থেকে ${toBn(i * 10 + 10)}`,
  emoji: GROUP_EMOJI[i],
}));

export function groupOf(n: number): NumberGroup {
  return NUMBER_GROUPS[Math.min(9, Math.max(0, Math.ceil(n / 10) - 1))];
}

export function numbersInGroup(groupId: number): NumberInfo[] {
  const g = NUMBER_GROUPS[groupId - 1];
  return g ? NUMBERS.slice(g.from - 1, g.to) : [];
}

/** "৩টি দশ আর ৭টি এক" — place-value helper for 11–100. */
export function placeValueText(n: number): string {
  if (n === 100) return "১০টি দশ = ১০০ (একশো)";
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (t === 0) return `${toBn(o)}টি এক`;
  if (o === 0) return `${toBn(t)}টি দশ`;
  return `${toBn(t)}টি দশ আর ${toBn(o)}টি এক`;
}
