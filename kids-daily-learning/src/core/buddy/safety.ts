/**
 * Buddy safety layer — runs on every child message BEFORE any model sees it
 * and on every reply BEFORE the child sees it. Deliberately conservative:
 * a false positive just means Buddy gently suggests asking a grown-up.
 */

export type SafetyVerdict =
  | { ok: true }
  | { ok: false; category: SafetyCategory; reply: string; notifyParent: boolean };

export type SafetyCategory = "personal-info" | "secret" | "unsafe" | "mature" | "distress" | "too-long";

const PERSONAL: RegExp[] = [
  /\b\d{3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/, // phone-ish numbers
  /[\w.+-]+@[\w-]+\.[\w.]+/, // email
  /\bmy (home )?address\b/i, /\bi live (at|on|in)\b/i, /\bmy (school|teacher'?s name|password|last name|surname|phone|number)\b/i,
  /\b(street|avenue|road|lane)\b.*\d|\d+.*\b(street|avenue|road|lane)\b/i,
];

const ASKS_FOR_PERSONAL = /\b(where do you live|what'?s your address|send (me )?(a )?(photo|picture|pic))\b/i;

const SECRET = /\b(keep (it|this|a) secret|don'?t tell (my )?(mom|mum|dad|parents?|anyone|teacher)|our (little )?secret)\b/i;

const UNSAFE = /\b(knife|knives|gun|weapon|bomb|explosive|poison|lighter|matches|fire ?works?|set .* on fire|make (a )?fire|drugs?|alcohol|beer|wine|vape|cigarette|pills?|medicine dose|climb (the )?roof|jump off|choke|choking game|challenge.*(tiktok|dare))\b/i;

const MATURE = /\b(sex|sexy|naked|nude|porn|dating|boyfriend|girlfriend|kiss(ing)?|drunk|gore|murder|horror|zombie|curse word|swear)\b/i;

const DISTRESS = /\b(i('?m| am) (so )?(sad|scared|lonely|afraid)|bull(y|ied|ying)|someone (hurt|hits?|touched) me|hurt myself|want to die|nobody likes me|hate myself)\b/i;

export const SAFE_REPLIES: Record<SafetyCategory, string> = {
  "personal-info": "Let's keep personal things like addresses, phone numbers, school names and passwords private — even from me! 🛡️ You never need to tell me those. What would you like to learn about?",
  secret: "It's always okay to tell your grown-ups anything. I don't keep secrets from parents — they're on your team! 💛 Is there something you'd like to learn about?",
  unsafe: "That could be dangerous, so it's a question for a grown-up you trust. 🧑‍🍼 I'd love to help with something else — want a fun science fact?",
  mature: "That's a topic for a grown-up you trust. Let's pick something else to explore together — animals, space or numbers? 🚀",
  distress: "Thank you for telling me. Your feelings matter. 💛 Please talk to a grown-up you trust right now — a parent, teacher or family member. They care about you and can help.",
  "too-long": "Wow, that's a lot of words! Can you ask me in a shorter way? ✏️",
};

export function checkChildMessage(text: string): SafetyVerdict {
  const t = text.trim();
  if (t.length > 400) return { ok: false, category: "too-long", reply: SAFE_REPLIES["too-long"], notifyParent: false };
  if (DISTRESS.test(t)) return { ok: false, category: "distress", reply: SAFE_REPLIES.distress, notifyParent: true };
  if (SECRET.test(t)) return { ok: false, category: "secret", reply: SAFE_REPLIES.secret, notifyParent: false };
  if (PERSONAL.some((r) => r.test(t)) || ASKS_FOR_PERSONAL.test(t)) return { ok: false, category: "personal-info", reply: SAFE_REPLIES["personal-info"], notifyParent: false };
  if (UNSAFE.test(t)) return { ok: false, category: "unsafe", reply: SAFE_REPLIES.unsafe, notifyParent: false };
  if (MATURE.test(t)) return { ok: false, category: "mature", reply: SAFE_REPLIES.mature, notifyParent: false };
  return { ok: true };
}

/** Output filter for model replies (production). Blocks anything that slipped through. */
export function checkBuddyReply(text: string): SafetyVerdict {
  if (MATURE.test(text) || UNSAFE.test(text)) return { ok: false, category: "mature", reply: "Hmm, let's talk about something else! Want to hear a fun fact about animals? 🐘", notifyParent: false };
  if (/\b(what('?s| is) your (address|phone|school|last name)|where do you live|send me)\b/i.test(text)) {
    return { ok: false, category: "personal-info", reply: SAFE_REPLIES["personal-info"], notifyParent: false };
  }
  if (SECRET.test(text)) return { ok: false, category: "secret", reply: SAFE_REPLIES.secret, notifyParent: false };
  return { ok: true };
}

/** System prompt for the production model call (see src/server/buddy.ts). */
export function buddySystemPrompt(age: number): string {
  return [
    `You are Buddy, a friendly learning helper robot in a children's education app. You are talking with a child aged ${age}.`,
    "Rules you must always follow:",
    "- Teach, don't just answer: guide with a hint or a step, then give the answer with a very simple explanation.",
    `- Use short sentences and words a ${age}-year-old understands. At most 4 sentences. One emoji is fine.`,
    "- Never ask for or repeat personal information (full name, address, school, phone, photos, passwords, location).",
    "- Never suggest keeping secrets from parents or trusted adults.",
    "- Never give instructions that could be dangerous (fire, tools, chemicals, medicine, climbing, dares).",
    "- Avoid mature, violent, scary, romantic or hateful topics; kindly redirect to learning.",
    "- If the child seems upset or unsafe, tell them kindly to talk to a trusted grown-up right away.",
    "- Be encouraging. Never shame mistakes.",
  ].join("\n");
}
