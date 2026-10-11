/**
 * English Learning — A to Z with uppercase/lowercase, a picture word, the
 * Bangla meaning, how to say the letter name (in Bangla script) and its
 * phonics sound with a Bangla-script hint.
 */

export interface EnLetter {
  upper: string;
  lower: string;
  word: string;
  emoji: string;
  /** Bangla meaning of the word. */
  bn: string;
  /** Letter name written in Bangla script, e.g. B → "বি". */
  name: string;
  /** Phonics sound, e.g. "/b/". */
  sound: string;
  /** Sound hint in Bangla script. */
  soundBn: string;
  /** Extra phonics note when the sound is special. */
  note?: string;
}

const L = (upper: string, word: string, emoji: string, bn: string, name: string, sound: string, soundBn: string, note?: string): EnLetter =>
  ({ upper, lower: upper.toLowerCase(), word, emoji, bn, name, sound, soundBn, note });

export const ALPHABET: EnLetter[] = [
  L("A", "Apple", "🍎", "আপেল", "এ", "/a/", "অ্যা"),
  L("B", "Ball", "⚽", "বল", "বি", "/b/", "ব"),
  L("C", "Cat", "🐱", "বিড়াল", "সি", "/k/", "ক", "C often sounds like /k/, as in cat."),
  L("D", "Dog", "🐶", "কুকুর", "ডি", "/d/", "ড"),
  L("E", "Egg", "🥚", "ডিম", "ই", "/e/", "এ"),
  L("F", "Fish", "🐟", "মাছ", "এফ", "/f/", "ফ"),
  L("G", "Goat", "🐐", "ছাগল", "জি", "/g/", "গ"),
  L("H", "Hat", "🎩", "টুপি", "এইচ", "/h/", "হ"),
  L("I", "Insect", "🐞", "পোকা", "আই", "/i/", "ই"),
  L("J", "Juice", "🧃", "জুস", "জে", "/j/", "জ"),
  L("K", "Kite", "🪁", "ঘুড়ি", "কে", "/k/", "ক"),
  L("L", "Lion", "🦁", "সিংহ", "এল", "/l/", "ল"),
  L("M", "Mango", "🥭", "আম", "এম", "/m/", "ম"),
  L("N", "Nest", "🪺", "পাখির বাসা", "এন", "/n/", "ন"),
  L("O", "Orange", "🍊", "কমলা", "ও", "/o/", "অ"),
  L("P", "Parrot", "🦜", "টিয়া পাখি", "পি", "/p/", "প"),
  L("Q", "Queen", "👸", "রানি", "কিউ", "/kw/", "কু", "Q usually comes with u: qu, as in queen."),
  L("R", "Rabbit", "🐇", "খরগোশ", "আর", "/r/", "র"),
  L("S", "Sun", "☀️", "সূর্য", "এস", "/s/", "স"),
  L("T", "Tiger", "🐯", "বাঘ", "টি", "/t/", "ট"),
  L("U", "Umbrella", "☂️", "ছাতা", "ইউ", "/u/", "আ", "In umbrella, u sounds like আ."),
  L("V", "Van", "🚐", "ভ্যান গাড়ি", "ভি", "/v/", "ভ"),
  L("W", "Watch", "⌚", "হাতঘড়ি", "ডাব্লিউ", "/w/", "উয়"),
  L("X", "Xylophone", "🎵", "জাইলোফোন (বাজনা)", "এক্স", "/ks/", "ক্স", "X usually sounds /ks/, as in box. At the start of xylophone it sounds like /z/."),
  L("Y", "Yo-yo", "🪀", "ইয়ো-ইয়ো (খেলনা)", "ওয়াই", "/y/", "ইয়"),
  L("Z", "Zebra", "🦓", "জেব্রা", "জেড", "/z/", "জ"),
];

/** Words for the spelling game (short, regular spellings). */
export const SPELLING_WORDS: { word: string; emoji: string; bn: string }[] = [
  { word: "cat", emoji: "🐱", bn: "বিড়াল" }, { word: "dog", emoji: "🐶", bn: "কুকুর" },
  { word: "sun", emoji: "☀️", bn: "সূর্য" }, { word: "hat", emoji: "🎩", bn: "টুপি" },
  { word: "egg", emoji: "🥚", bn: "ডিম" }, { word: "fish", emoji: "🐟", bn: "মাছ" },
  { word: "ball", emoji: "⚽", bn: "বল" }, { word: "kite", emoji: "🪁", bn: "ঘুড়ি" },
  { word: "duck", emoji: "🦆", bn: "হাঁস" }, { word: "cow", emoji: "🐄", bn: "গরু" },
  { word: "bus", emoji: "🚌", bn: "বাস" }, { word: "tree", emoji: "🌳", bn: "গাছ" },
  { word: "star", emoji: "⭐", bn: "তারা" }, { word: "book", emoji: "📚", bn: "বই" },
  { word: "milk", emoji: "🥛", bn: "দুধ" }, { word: "frog", emoji: "🐸", bn: "ব্যাঙ" },
];

export interface EnSentence { id: string; text: string; emoji: string; bn: string; words: string[] }

const s = (id: string, text: string, emoji: string, bn: string): EnSentence =>
  ({ id, text, emoji, bn, words: text.replace(/[.?!]$/, "").split(/\s+/) });

export const EN_SENTENCES: EnSentence[] = [
  s("e1", "I see a cat.", "🐱", "আমি একটি বিড়াল দেখি।"),
  s("e2", "The sun is hot.", "☀️", "সূর্য গরম।"),
  s("e3", "I can run fast.", "🏃", "আমি জোরে দৌড়াতে পারি।"),
  s("e4", "This is my red ball.", "⚽", "এটি আমার লাল বল।"),
  s("e5", "The fish can swim.", "🐟", "মাছ সাঁতার কাটতে পারে।"),
  s("e6", "We go to school.", "🏫", "আমরা স্কুলে যাই।"),
  s("e7", "I like mangoes.", "🥭", "আমি আম পছন্দ করি।"),
  s("e8", "The bird is in the nest.", "🪺", "পাখিটি বাসায় আছে।"),
];
