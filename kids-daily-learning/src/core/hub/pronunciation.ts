/**
 * Pronunciation guides and meanings for the Learning Hub's letter and word cards.
 *
 *  - Bangla letters: the letter's name and its sound, written in simple English
 *    letters (the way Bangladeshi children's books usually romanise Bangla).
 *  - Bangla words: a simple romanised pronunciation and the English meaning.
 *  - English words: how to say the word, written in Bangla script.
 *
 * Kept separate from the letter/word lists so those stay unchanged; tests make
 * sure every letter and word has an entry here.
 *
 * NEEDS REVIEW by a Bengali native speaker before release: romanisation of
 * Bangla is not standardised, and a few letters (ঙ, ঞ, ণ, ষ, ৎ, ং, ঃ, ঁ) have
 * names that vary by region and textbook.
 */

export interface BnLetterGuide {
  /** What the letter is called, e.g. "murdhonno-no". */
  name: string;
  /** The sound it makes, e.g. "n". */
  sound: string;
}

export interface BnWordGuide {
  /** Simple romanised pronunciation, e.g. "ojogor". */
  say: string;
  /** English meaning, e.g. "python". */
  en: string;
}

/** স্বরবর্ণ and ব্যঞ্জনবর্ণ: name and sound. */
export const BN_LETTER_GUIDE: Record<string, BnLetterGuide> = {
  // vowels
  "অ": { name: "o", sound: "o, like the o in “on”" },
  "আ": { name: "a", sound: "a, like the a in “father”" },
  "ই": { name: "hrosso-i", sound: "i, like the i in “sit”" },
  "ঈ": { name: "dirgho-i", sound: "i, a longer ই, like “see”" },
  "উ": { name: "hrosso-u", sound: "u, like the u in “put”" },
  "ঊ": { name: "dirgho-u", sound: "u, a longer উ, like “moon”" },
  "ঋ": { name: "ri", sound: "ri, like “ri” in “river”" },
  "এ": { name: "e", sound: "e, like the e in “bed”" },
  "ঐ": { name: "oi", sound: "oi, like “oi” in “oil”" },
  "ও": { name: "o", sound: "o, like the o in “go”" },
  "ঔ": { name: "ou", sound: "ou, o and u said together" },
  // consonants
  "ক": { name: "ko", sound: "k" },
  "খ": { name: "kho", sound: "kh, a breathy k" },
  "গ": { name: "go", sound: "g" },
  "ঘ": { name: "gho", sound: "gh, a breathy g" },
  "ঙ": { name: "ungo", sound: "ng, like the end of “sing”" },
  "চ": { name: "cho", sound: "ch" },
  "ছ": { name: "chho", sound: "chh, a breathy ch" },
  "জ": { name: "jo", sound: "j" },
  "ঝ": { name: "jho", sound: "jh, a breathy j" },
  "ঞ": { name: "iyo", sound: "n, said through the nose" },
  "ট": { name: "to", sound: "t, tongue curled up (hard t)" },
  "ঠ": { name: "tho", sound: "th, a breathy hard t" },
  "ড": { name: "do", sound: "d, tongue curled up (hard d)" },
  "ঢ": { name: "dho", sound: "dh, a breathy hard d" },
  "ণ": { name: "murdhonno-no", sound: "n" },
  "ত": { name: "to", sound: "t, tongue on the teeth (soft t)" },
  "থ": { name: "tho", sound: "th, a breathy soft t" },
  "দ": { name: "do", sound: "d, tongue on the teeth (soft d)" },
  "ধ": { name: "dho", sound: "dh, a breathy soft d" },
  "ন": { name: "dontto-no", sound: "n" },
  "প": { name: "po", sound: "p" },
  "ফ": { name: "pho", sound: "ph or f" },
  "ব": { name: "bo", sound: "b" },
  "ভ": { name: "bho", sound: "bh or v" },
  "ম": { name: "mo", sound: "m" },
  "য": { name: "ontostho-jo", sound: "j" },
  "র": { name: "ro", sound: "r" },
  "ল": { name: "lo", sound: "l" },
  "শ": { name: "talobbo-sho", sound: "sh" },
  "ষ": { name: "murdhonno-sho", sound: "sh" },
  "স": { name: "dontto-so", sound: "s or sh" },
  "হ": { name: "ho", sound: "h" },
  "ড়": { name: "doye-shunno-ro", sound: "r, the tongue flaps quickly" },
  "ঢ়": { name: "dhoye-shunno-ro", sound: "rh, a breathy flapped r" },
  "য়": { name: "ontostho-o", sound: "y" },
  "ৎ": { name: "khondo-to", sound: "t at the end of a sound" },
  "ং": { name: "onusshar", sound: "ng" },
  "ঃ": { name: "bisorgo", sound: "a short breath, or doubles the next sound" },
  "ঁ": { name: "chondrobindu", sound: "makes the sound go through the nose" },
};

/** Bangla picture words: romanised pronunciation and English meaning. */
export const BN_WORD_GUIDE: Record<string, BnWordGuide> = {
  // vowel words
  "অজগর": { say: "ojogor", en: "python (a big snake)" },
  "আম": { say: "am", en: "mango" },
  "ইঁদুর": { say: "indur", en: "mouse" },
  "ঈগল": { say: "igol", en: "eagle" },
  "উট": { say: "ut", en: "camel" },
  "ঊষা": { say: "usha", en: "dawn" },
  "ঋষি": { say: "rishi", en: "sage (a wise person)" },
  "একতারা": { say: "ektara", en: "ektara (a one-string instrument)" },
  "ঐরাবত": { say: "oirabot", en: "a great elephant" },
  "ওল": { say: "ol", en: "elephant-foot yam" },
  "ঔষধ": { say: "oushodh", en: "medicine" },
  // consonant words
  "কলা": { say: "kola", en: "banana" },
  "খরগোশ": { say: "khorgosh", en: "rabbit" },
  "গরু": { say: "goru", en: "cow" },
  "ঘড়ি": { say: "ghori", en: "clock" },
  "ব্যাঙ": { say: "byang", en: "frog" },
  "চশমা": { say: "choshma", en: "glasses" },
  "ছাতা": { say: "chhata", en: "umbrella" },
  "জাহাজ": { say: "jahaj", en: "ship" },
  "ঝুড়ি": { say: "jhuri", en: "basket" },
  "ইঞ্জিন": { say: "injin", en: "engine" },
  "টমেটো": { say: "tometo", en: "tomato" },
  "ঠোঁট": { say: "thont", en: "lips" },
  "ডাব": { say: "dab", en: "green coconut" },
  "ঢোল": { say: "dhol", en: "drum" },
  "হরিণ": { say: "horin", en: "deer" },
  "তরমুজ": { say: "tormuj", en: "watermelon" },
  "থালা": { say: "thala", en: "plate" },
  "দরজা": { say: "dorja", en: "door" },
  "ধান": { say: "dhan", en: "rice (paddy)" },
  "নৌকা": { say: "nouka", en: "boat" },
  "পাখি": { say: "pakhi", en: "bird" },
  "ফুল": { say: "phul", en: "flower" },
  "বল": { say: "bol", en: "ball" },
  "ভালুক": { say: "bhaluk", en: "bear" },
  "মাছ": { say: "machh", en: "fish" },
  "যব": { say: "job", en: "barley" },
  "রংধনু": { say: "rongdhonu", en: "rainbow" },
  "লাটিম": { say: "latim", en: "spinning top" },
  "শাপলা": { say: "shapla", en: "water lily" },
  "ষাঁড়": { say: "shar", en: "bull" },
  "সূর্য": { say: "shurjo", en: "sun" },
  "হাতি": { say: "hati", en: "elephant" },
  "পাহাড়": { say: "pahar", en: "hill" },
  "আষাঢ়": { say: "asharh", en: "Asharh (a rainy-season month)" },
  "ময়ূর": { say: "moyur", en: "peacock" },
  "উৎসব": { say: "utshob", en: "festival" },
  "রং": { say: "rong", en: "colour" },
  "দুঃখ": { say: "dukkho", en: "sadness" },
  "চাঁদ": { say: "chand", en: "moon" },
  // extra everyday words
  "বই": { say: "boi", en: "book" },
  "গাছ": { say: "gachh", en: "tree" },
  "বাড়ি": { say: "bari", en: "house" },
  "বিড়াল": { say: "biral", en: "cat" },
  "কুকুর": { say: "kukur", en: "dog" },
  "ডিম": { say: "dim", en: "egg" },
  "দুধ": { say: "dudh", en: "milk" },
  "তারা": { say: "tara", en: "star" },
  "গাড়ি": { say: "gari", en: "car" },
  "আপেল": { say: "apel", en: "apple" },
  "পেঁপে": { say: "pepe", en: "papaya" },
  "মেঘ": { say: "megh", en: "cloud" },
};

/** English words written the way they sound, in Bangla script. Keys are lower case. */
export const EN_WORD_SAY: Record<string, string> = {
  // A–Z picture words
  "apple": "অ্যাপল", "ball": "বল", "cat": "ক্যাট", "dog": "ডগ", "egg": "এগ", "fish": "ফিশ",
  "goat": "গোট", "hat": "হ্যাট", "insect": "ইনসেক্ট", "juice": "জুস", "kite": "কাইট", "lion": "লায়ন",
  "mango": "ম্যাঙ্গো", "nest": "নেস্ট", "orange": "অরেঞ্জ", "parrot": "প্যারট", "queen": "কুইন",
  "rabbit": "র‍্যাবিট", "sun": "সান", "tiger": "টাইগার", "umbrella": "আমব্রেলা", "van": "ভ্যান",
  "watch": "ওয়াচ", "xylophone": "জাইলোফোন", "yo-yo": "ইয়ো-ইয়ো", "zebra": "জেব্রা",
  // spelling words not already above
  "duck": "ডাক", "cow": "কাউ", "bus": "বাস", "tree": "ট্রি", "star": "স্টার", "book": "বুক",
  "milk": "মিল্ক", "frog": "ফ্রগ",
};

const nfc = (s: string) => s.normalize("NFC");
const LETTER_INDEX = new Map(Object.entries(BN_LETTER_GUIDE).map(([k, v]) => [nfc(k), v]));
const WORD_INDEX = new Map(Object.entries(BN_WORD_GUIDE).map(([k, v]) => [nfc(k), v]));

export function bnLetterGuide(letter: string): BnLetterGuide | undefined {
  return LETTER_INDEX.get(nfc(letter));
}

export function bnWordGuide(word: string): BnWordGuide | undefined {
  return WORD_INDEX.get(nfc(word));
}

export function enWordSay(word: string): string | undefined {
  return EN_WORD_SAY[word.toLowerCase()];
}
