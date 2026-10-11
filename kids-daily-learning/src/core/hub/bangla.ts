/**
 * বাংলা শিখি — letters, picture words and first sentences.
 * Every letter has one well-known example word (অ–অজগর, আ–আম, ক–কলা …),
 * an emoji picture and one very short Bangla sentence about the word.
 * Letters that never start a word (ঙ, ঞ, ণ, ড়, ঢ়, য়, ৎ, ং, ঃ, ঁ) use a
 * word that contains them, and the note says where the letter sits.
 */

export interface BnLetter {
  letter: string;
  word: string;
  emoji: string;
  /** One short sentence about the word. */
  line: string;
  /** Where the letter sits when it is not at the start of the word. */
  note?: string;
}

/** স্বরবর্ণ — all 11 Bangla vowels. */
export const VOWELS: BnLetter[] = [
  { letter: "অ", word: "অজগর", emoji: "🐍", line: "অজগর একটি বিশাল সাপ।" },
  { letter: "আ", word: "আম", emoji: "🥭", line: "আম একটি মিষ্টি ফল।" },
  { letter: "ই", word: "ইঁদুর", emoji: "🐭", line: "ইঁদুর ছোট্ট একটি প্রাণী।" },
  { letter: "ঈ", word: "ঈগল", emoji: "🦅", line: "ঈগল অনেক উঁচুতে ওড়ে।" },
  { letter: "উ", word: "উট", emoji: "🐫", line: "উট মরুভূমিতে থাকে।" },
  { letter: "ঊ", word: "ঊষা", emoji: "🌅", line: "ঊষা মানে ভোরবেলা।" },
  { letter: "ঋ", word: "ঋষি", emoji: "🧘", line: "ঋষি মানে জ্ঞানী মানুষ।" },
  { letter: "এ", word: "একতারা", emoji: "🪕", line: "একতারা একটি বাদ্যযন্ত্র।" },
  { letter: "ঐ", word: "ঐরাবত", emoji: "🐘", line: "ঐরাবত মানে বড় হাতি।" },
  { letter: "ও", word: "ওল", emoji: "🥔", line: "ওল একটি সবজি।" },
  { letter: "ঔ", word: "ঔষধ", emoji: "💊", line: "অসুখ হলে ঔষধ খাই।" },
];

/** ব্যঞ্জনবর্ণ — the 39 consonants in the usual textbook order. */
export const CONSONANTS: BnLetter[] = [
  { letter: "ক", word: "কলা", emoji: "🍌", line: "কলা খেতে মিষ্টি।" },
  { letter: "খ", word: "খরগোশ", emoji: "🐇", line: "খরগোশ লাফিয়ে চলে।" },
  { letter: "গ", word: "গরু", emoji: "🐄", line: "গরু আমাদের দুধ দেয়।" },
  { letter: "ঘ", word: "ঘড়ি", emoji: "⏰", line: "ঘড়ি সময় বলে দেয়।" },
  { letter: "ঙ", word: "ব্যাঙ", emoji: "🐸", line: "ব্যাঙ লাফিয়ে চলে।", note: "ঙ শব্দের শেষে থাকে।" },
  { letter: "চ", word: "চশমা", emoji: "👓", line: "চশমা চোখে পরি।" },
  { letter: "ছ", word: "ছাতা", emoji: "☂️", line: "বৃষ্টিতে ছাতা লাগে।" },
  { letter: "জ", word: "জাহাজ", emoji: "🚢", line: "জাহাজ পানিতে ভাসে।" },
  { letter: "ঝ", word: "ঝুড়ি", emoji: "🧺", line: "ঝুড়িতে ফল রাখি।" },
  { letter: "ঞ", word: "ইঞ্জিন", emoji: "🚂", line: "ইঞ্জিন রেলগাড়ি টানে।", note: "ঞ শব্দের মাঝখানে থাকে।" },
  { letter: "ট", word: "টমেটো", emoji: "🍅", line: "টমেটো লাল রঙের।" },
  { letter: "ঠ", word: "ঠোঁট", emoji: "👄", line: "ঠোঁট দিয়ে হাসি।" },
  { letter: "ড", word: "ডাব", emoji: "🥥", line: "ডাবের পানি খেতে মজা।" },
  { letter: "ঢ", word: "ঢোল", emoji: "🥁", line: "ঢোল বাজে ঢুম ঢুম।" },
  { letter: "ণ", word: "হরিণ", emoji: "🦌", line: "হরিণ খুব জোরে দৌড়ায়।", note: "ণ শব্দের শেষে থাকে।" },
  { letter: "ত", word: "তরমুজ", emoji: "🍉", line: "তরমুজের ভেতরটা লাল।" },
  { letter: "থ", word: "থালা", emoji: "🍽️", line: "থালায় ভাত খাই।" },
  { letter: "দ", word: "দরজা", emoji: "🚪", line: "দরজা খুলে ঘরে ঢুকি।" },
  { letter: "ধ", word: "ধান", emoji: "🌾", line: "ধান থেকে চাল হয়।" },
  { letter: "ন", word: "নৌকা", emoji: "⛵", line: "নৌকা নদীতে চলে।" },
  { letter: "প", word: "পাখি", emoji: "🐦", line: "পাখি আকাশে ওড়ে।" },
  { letter: "ফ", word: "ফুল", emoji: "🌸", line: "ফুল দেখতে সুন্দর।" },
  { letter: "ব", word: "বল", emoji: "⚽", line: "বল নিয়ে খেলি।" },
  { letter: "ভ", word: "ভালুক", emoji: "🐻", line: "ভালুক মধু ভালোবাসে।" },
  { letter: "ম", word: "মাছ", emoji: "🐟", line: "মাছ পানিতে থাকে।" },
  { letter: "য", word: "যব", emoji: "🌱", line: "যব একটি শস্যদানা।" },
  { letter: "র", word: "রংধনু", emoji: "🌈", line: "বৃষ্টির পরে রংধনু ওঠে।" },
  { letter: "ল", word: "লাটিম", emoji: "🪀", line: "লাটিম ঘুরে ঘুরে চলে।" },
  { letter: "শ", word: "শাপলা", emoji: "🪷", line: "শাপলা আমাদের জাতীয় ফুল।" },
  { letter: "ষ", word: "ষাঁড়", emoji: "🐂", line: "ষাঁড় অনেক শক্তিশালী।" },
  { letter: "স", word: "সূর্য", emoji: "☀️", line: "সূর্য আমাদের আলো দেয়।" },
  { letter: "হ", word: "হাতি", emoji: "🐘", line: "হাতি অনেক বড় প্রাণী।" },
  { letter: "ড়", word: "পাহাড়", emoji: "⛰️", line: "পাহাড় অনেক উঁচু।", note: "ড় শব্দের মাঝে বা শেষে থাকে।" },
  { letter: "ঢ়", word: "আষাঢ়", emoji: "🌧️", line: "আষাঢ় মাসে অনেক বৃষ্টি হয়।", note: "ঢ় শব্দের শেষে থাকে।" },
  { letter: "য়", word: "ময়ূর", emoji: "🦚", line: "ময়ূর পেখম মেলে নাচে।", note: "য় শব্দের মাঝে বা শেষে থাকে।" },
  { letter: "ৎ", word: "উৎসব", emoji: "🎉", line: "উৎসবে সবাই আনন্দ করে।", note: "ৎ শব্দের মাঝে বা শেষে থাকে।" },
  { letter: "ং", word: "রং", emoji: "🎨", line: "রং দিয়ে ছবি আঁকি।", note: "ং অক্ষরের পরে বসে।" },
  { letter: "ঃ", word: "দুঃখ", emoji: "😢", line: "দুঃখ পেলে বড়দের বলো।", note: "ঃ অক্ষরের পরে বসে।" },
  { letter: "ঁ", word: "চাঁদ", emoji: "🌙", line: "রাতের আকাশে চাঁদ ওঠে।", note: "ঁ অক্ষরের মাথায় বসে।" },
];

export const ALL_BN_LETTERS: BnLetter[] = [...VOWELS, ...CONSONANTS];

/** Extra everyday picture words for শব্দ শেখা (beyond the letter words). */
export const BN_EXTRA_WORDS: { word: string; emoji: string }[] = [
  { word: "বই", emoji: "📚" }, { word: "গাছ", emoji: "🌳" }, { word: "বাড়ি", emoji: "🏠" },
  { word: "বিড়াল", emoji: "🐱" }, { word: "কুকুর", emoji: "🐶" }, { word: "ডিম", emoji: "🥚" },
  { word: "দুধ", emoji: "🥛" }, { word: "তারা", emoji: "⭐" }, { word: "গাড়ি", emoji: "🚗" },
  { word: "আপেল", emoji: "🍎" }, { word: "পেঁপে", emoji: "🍈" }, { word: "মেঘ", emoji: "☁️" },
];

export interface BnSentence {
  id: string;
  text: string;
  emoji: string;
  /** Words in order, used for the sentence-building game. */
  words: string[];
}

const s = (id: string, text: string, emoji: string): BnSentence =>
  ({ id, text, emoji, words: text.replace(/[।?!]$/, "").split(/\s+/) });

/** শব্দ থেকে বাক্য — short, everyday sentences. */
export const BN_SENTENCES: BnSentence[] = [
  s("s1", "আমি আম খাই।", "🥭"),
  s("s2", "পাখি আকাশে ওড়ে।", "🐦"),
  s("s3", "বিড়াল দুধ খায়।", "🐱"),
  s("s4", "নৌকা নদীতে চলে।", "⛵"),
  s("s5", "আমার একটি লাল বল আছে।", "⚽"),
  s("s6", "আমরা স্কুলে যাই।", "🏫"),
  s("s7", "ফুলটি খুব সুন্দর।", "🌸"),
  s("s8", "সূর্য সকালে ওঠে।", "🌅"),
  s("s9", "মা রান্না করেন।", "🍲"),
  s("s10", "বাবা বাজারে যান।", "🛒"),
];

export function findBnLetter(letter: string): BnLetter | undefined {
  const n = letter.normalize("NFC");
  return ALL_BN_LETTERS.find((l) => l.letter.normalize("NFC") === n);
}
