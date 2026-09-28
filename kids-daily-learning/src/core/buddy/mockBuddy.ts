import type { VocabWord } from "../types";

/**
 * MOCK Buddy brain — deterministic, offline, teaching-first replies.
 * Used in the demo and whenever BUDDY_PROVIDER=mock. The production path
 * (src/server/buddy.ts) wraps a real model with the same safety layer.
 */

export interface BuddyReply { text: string; followUp?: string; suggestions?: string[]; }

const FACTS: { keys: RegExp; text: string; followUp?: string }[] = [
  { keys: /sky.*blue|blue.*sky/i, text: "Sunlight looks white, but it's really made of all the colors of the rainbow. When sunlight travels through the air around Earth, the tiny bits of air bounce the blue light around the most — so blue light reaches our eyes from every part of the sky! 🌤️", followUp: "Can you guess why sunsets look orange and red?" },
  { keys: /sunset|orange sky/i, text: "At sunset, sunlight travels through much more air to reach you. The blue light gets bounced away along the path, so the reds and oranges are left for your eyes. 🌅" },
  { keys: /rainbow/i, text: "A rainbow happens when sunlight shines through raindrops. Each drop bends the light and splits it into colors: red, orange, yellow, green, blue, indigo and violet. 🌈", followUp: "Tip: stand with the sun behind you after rain to spot one!" },
  { keys: /moon.*(light|shine|glow)|why.*moon/i, text: "The Moon doesn't make its own light. It's like a giant mirror — sunlight bounces off it and comes to Earth. 🌕", followUp: "Did you know the Moon takes about 27 days to go around Earth?" },
  { keys: /planet|solar system/i, text: "There are 8 planets going around our Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune. Jupiter is the biggest! 🪐", followUp: "Here's a trick to remember them: My Very Easy Method Just Speeds Up Naming." },
  { keys: /dinosaur/i, text: "Dinosaurs lived millions of years ago — long before people. We learn about them from fossils, which are bones and footprints turned to stone. 🦕", followUp: "Some dinosaurs were as small as a chicken!" },
  { keys: /cat.*purr|purr/i, text: "Cats purr when they feel happy and relaxed — and sometimes to calm themselves down. The sound comes from muscles in their throat moving very fast. 🐱" },
  { keys: /plants?.*(grow|need|eat|food)|photosynthesis/i, text: "Plants make their own food! They use sunlight, water from their roots and air through their leaves. This is called photosynthesis. 🌱", followUp: "What do you think happens to a plant kept in the dark?" },
  { keys: /heart/i, text: "Your heart is a strong muscle about the size of your fist. It pumps blood around your whole body, about 100,000 times a day! 🫀" },
  { keys: /bees?|honey/i, text: "Bees collect nectar from flowers and turn it into honey in their hive. While they visit flowers, they also carry pollen, which helps new plants grow. 🐝" },
  { keys: /ocean|sea.*salt|salty/i, text: "The ocean is salty because rivers carry tiny bits of salt from rocks into the sea. When the water evaporates, the salt stays behind. 🌊" },
  { keys: /volcano/i, text: "A volcano is an opening in Earth's crust. Deep underground, rock is so hot it melts into magma. When it comes out, we call it lava! 🌋" },
  { keys: /gravity/i, text: "Gravity is an invisible pull. Earth pulls everything toward its middle — that's why a ball falls down when you drop it. 🍎" },
  { keys: /cloud/i, text: "Clouds are made of billions of tiny water droplets floating in the air. When the droplets join together and get heavy, they fall as rain. ☁️" },
  { keys: /magnet/i, text: "Magnets pull on things made of iron. Every magnet has a north and a south end: opposites pull together, and the same ends push apart. 🧲" },
  { keys: /fraction/i, text: "A fraction is a part of a whole. If you cut a pizza into 4 equal slices and eat 1, you ate 1/4 — one out of four! 🍕", followUp: "If you eat 2 slices, what fraction is that?" },
  { keys: /noun/i, text: "A noun is a word for a person, place or thing — like teacher, park or apple. 🍎", followUp: "Can you spot the noun in: 'The dog runs'?" },
  { keys: /verb/i, text: "A verb is an action word — it tells what someone does, like run, jump, read or sing. 🏃" },
];

const JOKES = [
  "Why did the math book look sad? Because it had too many problems! 📘😄",
  "What do you call a sleeping dinosaur? A dino-snore! 🦕💤",
  "Why did the cookie go to the doctor? Because it felt crummy! 🍪",
];

function arithmetic(text: string): BuddyReply | null {
  const m = text.replace(/,/g, "").match(/(\d{1,4})\s*(\+|plus|-|−|minus|x|×|\*|times|÷|\/|divided by)\s*(\d{1,4})/i);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  const op = m[2].toLowerCase();
  if (op === "+" || op === "plus") {
    if (b <= 5 && a <= 20) {
      const steps = Array.from({ length: b }, (_, i) => a + i + 1).join("... ");
      return { text: `Let's count together! ${a}... ${steps}! 🎉 The answer is ${a + b}.`, followUp: `We started at ${a} and counted on ${b} more. Now you try: what is ${a} + ${b + 1}?` };
    }
    return { text: `Let's split it up! First add the tens, then the ones. ${a} + ${b} = ${a + b}. 🎉`, followUp: "Want to try one on your own?" };
  }
  if (op === "-" || op === "−" || op === "minus") {
    if (b > a) return { text: `${a} − ${b} goes below zero, which is a bit advanced! It equals ${a - b}. Negative numbers are like going below ground floor in an elevator. 🛗` };
    return { text: `Let's count back! Start at ${a} and take away ${b}. You land on ${a - b}. 🎉`, followUp: `Check it: does ${a - b} + ${b} make ${a}?` };
  }
  if (["x", "×", "*", "times"].includes(op)) {
    return { text: `${a} × ${b} means ${b} groups of ${a}. ${b <= 5 ? `Let's skip count: ${Array.from({ length: b }, (_, i) => a * (i + 1)).join(", ")}. ` : ""}So ${a} × ${b} = ${a * b}! 🎉`, followUp: `Fun fact: ${b} × ${a} is the same answer.` };
  }
  if (b === 0) return { text: "Dividing by zero is a puzzle even grown-up mathematicians say can't be done! Try another number. 🤔" };
  const q = Math.floor(a / b);
  const r = a % b;
  return { text: `${a} ÷ ${b} means sharing ${a} into ${b} equal groups. Each group gets ${q}${r ? `, with ${r} left over` : ""}. 🎉`, followUp: r ? undefined : `Check it: ${b} × ${q} = ${a}.` };
}

export function mockBuddyReply(text: string, ctx: { name: string; age: number; vocab: VocabWord[] }): BuddyReply {
  const t = text.trim();
  if (!t) return { text: "Ask me anything you're curious about! 🤖" };

  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(t)) {
    return { text: `Hi ${ctx.name}! I'm Buddy 🤖. I love questions! You can ask me about numbers, words, animals, space and more.`, suggestions: ["What is 5 + 3?", "Why is the sky blue?", "Tell me a joke"] };
  }
  if (/joke|funny/i.test(t)) return { text: JOKES[t.length % JOKES.length] };

  const math = arithmetic(t);
  if (math) return math;

  const spell = t.match(/how (do you|to) spell ([a-z]+)/i);
  if (spell) {
    const word = spell[2].toLowerCase();
    return { text: `Let's sound it out together: ${word.split("").join(" - ").toUpperCase()}. That spells “${word}”! ✏️`, followUp: "Try writing it three times to remember it." };
  }

  const meaning = t.match(/(what does|meaning of|what is|define) ["“]?([a-z]+)["”]?( mean)?/i);
  if (meaning) {
    const w = ctx.vocab.find((v) => v.word.toLowerCase() === meaning[2].toLowerCase());
    if (w) return { text: `“${w.word}” ${w.emoji} means: ${w.meaning} For example: “${w.example}”`, followUp: `Can you make your own sentence with “${w.word.toLowerCase()}”?` };
  }

  for (const f of FACTS) if (f.keys.test(t)) return { text: f.text, followUp: f.followUp };

  if (/\?$/.test(t) || /^(why|what|how|who|where|when)\b/i.test(t)) {
    return {
      text: "Ooh, great question! I'm not sure about that one yet. A good way to find out is to ask a grown-up to look it up with you, or check a library book. 📚",
      suggestions: ["Why is the sky blue?", "What is 7 × 6?", "What does curious mean?"],
    };
  }
  return { text: "I love learning with you! Try asking me a question like “What is 9 + 4?” or “How do plants grow?” 🌱", suggestions: ["How do plants grow?", "What is 9 + 4?", "Tell me a joke"] };
}
