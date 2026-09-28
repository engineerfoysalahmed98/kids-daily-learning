import type { VocabWord, Level } from "../types";

const w = (level: Level, word: string, emoji: string, meaning: string, example: string): VocabWord => ({
  id: `w-${word.toLowerCase()}`, level, word, emoji, meaning, example,
});

export const VOCAB: VocabWord[] = [
  // Level 1 — first words (ages 4–5): letter sounds + picture words
  w(1, "Apple", "🍎", "A round fruit that grows on trees.", "I eat a red apple."),
  w(1, "Ball", "⚽", "A round toy you can kick or throw.", "We play with a ball."),
  w(1, "Cat", "🐱", "A small furry pet that says meow.", "The cat is sleeping."),
  w(1, "Dog", "🐶", "A friendly pet that says woof.", "My dog can run fast."),
  w(1, "Egg", "🥚", "Birds and hens lay eggs.", "The hen laid an egg."),
  w(1, "Fish", "🐟", "An animal that swims in water.", "The fish swims in the pond."),
  w(1, "Hat", "👒", "You wear it on your head.", "I wear a sun hat."),
  w(1, "Moon", "🌙", "It shines in the night sky.", "The moon is bright."),
  w(1, "Sun", "☀️", "It gives us light and warmth.", "The sun is hot."),
  w(1, "Tree", "🌳", "A tall plant with leaves and branches.", "Birds sit in the tree."),

  // Level 2 — everyday describing words (ages 6–7)
  w(2, "Curious", "🧐", "Wanting to know or learn about something.", "The curious kitten looked in the box."),
  w(2, "Gentle", "🤲", "Kind and soft, not rough.", "Be gentle when you hold the puppy."),
  w(2, "Enormous", "🐘", "Very, very big.", "An elephant is enormous."),
  w(2, "Whisper", "🤫", "To speak very quietly.", "We whisper in the library."),
  w(2, "Brave", "🦁", "Ready to do something even if it feels scary.", "She was brave at the doctor."),
  w(2, "Tiny", "🐜", "Very, very small.", "An ant is tiny."),
  w(2, "Shiny", "✨", "Bright and sparkly in the light.", "My new shoes are shiny."),
  w(2, "Gather", "🧺", "To bring things together in one place.", "Let's gather the leaves."),
  w(2, "Cozy", "🛋️", "Warm, soft and comfy.", "The blanket is cozy."),
  w(2, "Giggle", "😆", "A small, happy laugh.", "The joke made us giggle."),

  // Level 3 — school words (age 8)
  w(3, "Habitat", "🏞️", "The natural home of an animal or plant.", "The pond is a frog's habitat."),
  w(3, "Explore", "🧭", "To travel around a place to learn about it.", "We explored the forest trail."),
  w(3, "Predict", "🔮", "To say what you think will happen next.", "I predict it will rain today."),
  w(3, "Fragile", "🏺", "Easy to break.", "Be careful, the glass is fragile."),
  w(3, "Journey", "🚂", "A trip from one place to another.", "The train journey took two hours."),
  w(3, "Observe", "👀", "To watch something carefully.", "We observed the caterpillar every day."),
  w(3, "Rapid", "💨", "Very fast.", "The river has rapid water."),
  w(3, "Invent", "💡", "To make something new that did not exist before.", "She wants to invent a flying bike."),
  w(3, "Protect", "🛡️", "To keep safe from harm.", "Helmets protect our heads."),
  w(3, "Delicious", "😋", "Tasting very good.", "The soup was delicious."),

  // Level 4 — stronger vocabulary (ages 9–10)
  w(4, "Ancient", "🏛️", "Very, very old — from long ago.", "We visited an ancient castle."),
  w(4, "Cautious", "🚦", "Careful to avoid danger or mistakes.", "Be cautious when crossing the road."),
  w(4, "Generous", "🎁", "Happy to give and share with others.", "He was generous with his crayons."),
  w(4, "Vast", "🌌", "Extremely large in size or amount.", "The ocean is vast."),
  w(4, "Reluctant", "😕", "Not wanting to do something.", "The cat was reluctant to take a bath."),
  w(4, "Glimmer", "🕯️", "A faint, wavering light.", "A glimmer of light came from the cave."),
  w(4, "Investigate", "🔍", "To look into something to find the facts.", "The class investigated why plants lean to light."),
  w(4, "Abundant", "🍇", "More than enough; plenty.", "Fruit is abundant in summer."),
  w(4, "Peculiar", "🦓", "Strange or unusual.", "The fish had a peculiar shape."),
  w(4, "Nervous", "😬", "Worried about something that might happen.", "I felt nervous before the play."),

  // Level 5 — advanced vocabulary (ages 11–12)
  w(5, "Persevere", "🧗", "To keep trying even when something is hard.", "She persevered until she solved the puzzle."),
  w(5, "Meticulous", "🧵", "Very careful about every small detail.", "He kept meticulous notes in his science journal."),
  w(5, "Ambitious", "🏔️", "Having a big goal and working hard to reach it.", "Their ambitious plan was to clean the whole beach."),
  w(5, "Contemplate", "🤔", "To think about something deeply.", "She contemplated which book to read next."),
  w(5, "Ecosystem", "🌿", "Living things and their environment working together.", "A coral reef is a busy ecosystem."),
  w(5, "Resilient", "🌱", "Able to recover quickly after something difficult.", "Resilient plants grow back after a storm."),
  w(5, "Eloquent", "🎤", "Able to speak or write clearly and beautifully.", "Her eloquent speech made everyone listen."),
  w(5, "Hypothesis", "🧪", "An idea you can test with an experiment.", "Our hypothesis was that warm water melts ice faster."),
  w(5, "Inevitable", "🌅", "Certain to happen; cannot be avoided.", "Sunset is inevitable every evening."),
  w(5, "Benevolent", "💝", "Kind and wanting to help others.", "The benevolent neighbor fixed our fence."),
];

/** Simple grammar items used by English activities (level 3+). */
export const GRAMMAR = {
  nounsVerbs: [
    { sentence: "The dog runs in the park.", noun: "dog", verb: "runs" },
    { sentence: "Maya paints a rainbow.", noun: "Maya", verb: "paints" },
    { sentence: "The bird sings every morning.", noun: "bird", verb: "sings" },
    { sentence: "Our class plants a tree.", noun: "class", verb: "plants" },
    { sentence: "The baby laughs loudly.", noun: "baby", verb: "laughs" },
  ],
  plurals: [
    ["cat", "cats"], ["box", "boxes"], ["baby", "babies"], ["leaf", "leaves"], ["child", "children"], ["mouse", "mice"], ["bus", "buses"],
  ] as [string, string][],
  opposites: [
    ["hot", "cold"], ["happy", "sad"], ["fast", "slow"], ["up", "down"], ["open", "closed"], ["big", "small"], ["early", "late"], ["loud", "quiet"],
  ] as [string, string][],
  sentences: [
    "The cat sat on the mat",
    "We love to read books",
    "Birds fly high in the sky",
    "My friend shares her snack",
    "The curious fox explored the forest",
    "Scientists observe the stars at night",
    "Kind words make people smile",
  ],
  punctuation: [
    { text: "Where are you going", mark: "?" },
    { text: "I love my family", mark: "." },
    { text: "Wow, that is amazing", mark: "!" },
    { text: "What time is lunch", mark: "?" },
  ],
};
