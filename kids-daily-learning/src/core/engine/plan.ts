import type { Activity, Child, Completion, ContentStore, KnowledgeUnit, Level, Story, Track } from "../types";
import { TRACK_META } from "../content/meta";
import { decideLevel } from "./levels";
import { createRng, dayKey, daysBetween, isValidDay } from "./util";
import { MATH_TITLES, mathQuestions, quickMathQuestions } from "./generators/math";
import { ENGLISH_TITLES, englishQuestions, pickWords, wordCards, wordMatchQuestions } from "./generators/english";
import { brainQuestions } from "./generators/brain";

export interface PlanContext {
  child: Child;
  history: Completion[];
  content: ContentStore;
  timeZone?: string;
}

const DAILY_ORDER: Track[] = ["english", "math", "science", "story", "brain", "creativity", "habit"];

function childStartDay(ctx: PlanContext): string {
  return dayKey(new Date(ctx.child.createdAt), ctx.timeZone);
}

function trackEnabled(ctx: PlanContext, track: Track): boolean {
  const subject = TRACK_META[track].subject;
  const subjectOn = ctx.content.subjects.find((s) => s.id === subject)?.enabled ?? true;
  return subjectOn && ctx.child.settings.allowedTracks.includes(track);
}

// ---------------------------------------------------------------- builders

function mathActivity(id: string, level: Level, seed: string): Activity {
  const rng = createRng(seed);
  const t = MATH_TITLES[level];
  const questions = mathQuestions(level, 6, rng, id);
  return { id, track: "math", subject: "math", kind: "quiz", title: t.title, description: t.description, icon: "🔢", difficulty: level, minutes: 5, questions };
}

function englishActivity(id: string, level: Level, rotation: number, seed: string, content: ContentStore): Activity {
  const rng = createRng(seed);
  const words = pickWords(content.vocab, level, rotation);
  const t = ENGLISH_TITLES[level];
  return {
    id, track: "english", subject: "english", kind: "lesson-quiz", title: t.title, description: t.description, icon: "🔤",
    difficulty: level, minutes: 6, lesson: wordCards(words, level), questions: englishQuestions(words, level, rng, id, content.vocab),
  };
}

function brainActivity(id: string, level: Level, seed: string, title = "Pattern Puzzle"): Activity {
  const rng = createRng(seed);
  return { id, track: "brain", subject: "math", kind: "quiz", title, description: "Spot the pattern and solve today's puzzles", icon: "🧠", difficulty: level, minutes: 4, questions: brainQuestions(level, rng, id) };
}

function unitActivity(id: string, unit: KnowledgeUnit): Activity {
  return {
    id, track: unit.subject, subject: unit.subject, kind: "lesson-quiz", title: unit.title,
    description: `${unit.cards.length} fun facts and a quick quiz`, icon: unit.icon, difficulty: unit.level,
    minutes: 5, lesson: unit.cards, questions: unit.questions,
  };
}

function storyActivity(id: string, story: Story): Activity {
  return {
    id, track: "story", subject: "english", kind: "story", title: story.title, description: "Read or listen, then answer questions",
    icon: "📖", difficulty: (story.minAge <= 5 ? 1 : story.minAge <= 7 ? 2 : story.minAge <= 8 ? 3 : story.minAge <= 10 ? 4 : 5) as Level,
    minutes: Math.max(4, story.paragraphs.length + 2), storyId: story.id, questions: story.questions,
  };
}

export function unitsFor(content: ContentStore, subject: "science" | "gk", level: Level): KnowledgeUnit[] {
  for (let spread = 0; spread <= 4; spread++) {
    const found = content.units.filter((u) => u.subject === subject && Math.abs(u.level - level) === spread);
    if (found.length) return spread === 0 ? found : found.sort((a, b) => a.level - b.level);
  }
  return [];
}

export function storiesFor(content: ContentStore, age: number): Story[] {
  const fit = content.stories.filter((s) => age >= s.minAge && age <= s.maxAge);
  return fit.length ? fit : content.stories;
}

// ---------------------------------------------------------------- daily plan

function dailyActivity(ctx: PlanContext, day: string, track: Track): Activity | null {
  const { child, content, history } = ctx;
  const dayIndex = Math.max(0, daysBetween(childStartDay(ctx), day));
  const id = `d.${day}.${track}`;
  const seed = `${child.id}|${id}`;
  const level = decideLevel(child, track === "gk" ? "science" : track, history, day, content.ageGroups).level;

  switch (track) {
    case "english": return englishActivity(id, level, dayIndex, seed, content);
    case "math": return mathActivity(id, level, seed);
    case "brain": return brainActivity(id, level, seed);
    case "science":
    case "gk": {
      const units = unitsFor(content, track, level);
      if (!units.length) return null;
      return unitActivity(id, units[Math.floor(dayIndex / 2) % units.length]);
    }
    case "story": {
      const stories = storiesFor(content, child.age);
      if (!stories.length) return null;
      return storyActivity(id, stories[dayIndex % stories.length]);
    }
    case "creativity": {
      const prompts = content.creative.filter((p) => child.age >= p.minAge);
      if (!prompts.length) return null;
      const p = prompts[dayIndex % prompts.length];
      return { id, track, subject: "creativity", kind: "creative", title: p.title, description: "Draw or create something", icon: p.icon, difficulty: level, minutes: 10, creative: p };
    }
    case "habit": {
      const habits = content.habits.filter((h) => child.age >= h.minAge);
      if (!habits.length) return null;
      const h = habits[dayIndex % habits.length];
      return { id, track, subject: "habits", kind: "habit", title: h.title, description: h.why, icon: h.icon, difficulty: 1, minutes: 5, habit: h };
    }
  }
}

/**
 * Today's Adventure: 5–7 activities chosen for this child and day.
 * Science and World (GK) alternate days; parent settings can switch tracks off.
 */
export function buildDailyPlan(ctx: PlanContext, day: string): Activity[] {
  const dayIndex = Math.max(0, daysBetween(childStartDay(ctx), day));
  const out: Activity[] = [];
  for (const slot of DAILY_ORDER) {
    let track: Track = slot;
    if (slot === "science") {
      const preferred: Track = dayIndex % 2 === 0 ? "science" : "gk";
      const other: Track = preferred === "science" ? "gk" : "science";
      track = trackEnabled(ctx, preferred) ? preferred : other;
    }
    if (!trackEnabled(ctx, track)) continue;
    const a = dailyActivity(ctx, day, track);
    if (a) out.push(a);
  }
  return out;
}

// ---------------------------------------------------------------- practice & games

export type GameId = "pattern" | "quickmath" | "wordmatch" | "memory";

export const GAMES: { id: GameId; title: string; icon: string; description: string; color: string }[] = [
  { id: "memory", title: "Memory Match", icon: "🃏", description: "Flip cards and find the pairs", color: "brain" },
  { id: "pattern", title: "Pattern Puzzle", icon: "🧩", description: "What comes next?", color: "story" },
  { id: "quickmath", title: "Quick Math", icon: "⚡", description: "8 speedy sums — no timer, just fun", color: "math" },
  { id: "wordmatch", title: "Word Match", icon: "🔤", description: "Match words to pictures", color: "english" },
];

export function practiceId(track: Track, level: Level, seed: number): string {
  return `p.${track}.${level}.${seed}`;
}

/**
 * Rebuilds any activity from its id. Server routes use this to score an
 * attempt against the real answer key instead of trusting the client.
 *
 * Id formats:
 *   d.<YYYY-MM-DD>.<track>        daily activity
 *   p.<track>.<level>.<seed>      practice (english / math / brain)
 *   u.<unitId>                    science or world unit
 *   s.<storyId>                   story
 *   c.<promptId> / h.<habitId>    creative prompt / habit
 *   g.<game>.<level>.<seed>       mini-game
 */
export function resolveActivity(ctx: PlanContext, id: string): Activity | null {
  const parts = id.split(".");
  const { content, child } = ctx;
  const lvl = (s: string): Level | null => (["1", "2", "3", "4", "5"].includes(s) ? (Number(s) as Level) : null);

  switch (parts[0]) {
    case "d": {
      const [, day, track] = parts;
      if (!isValidDay(day) || !(track in TRACK_META)) return null;
      return dailyActivity(ctx, day, track as Track);
    }
    case "p": {
      const [, track, l, seed] = parts;
      const level = lvl(l);
      if (!level || !/^\d{1,9}$/.test(seed ?? "")) return null;
      const s = `${child.id}|${id}`;
      if (track === "math") return { ...mathActivity(id, level, s), title: `${MATH_TITLES[level].title} Practice` };
      if (track === "brain") return brainActivity(id, level, s, "Brain Workout");
      if (track === "english") return englishActivity(id, level, Number(seed), s, content);
      return null;
    }
    case "u": {
      const unit = content.units.find((u) => u.id === parts.slice(1).join("."));
      return unit ? unitActivity(id, unit) : null;
    }
    case "s": {
      const story = content.stories.find((s) => s.id === parts.slice(1).join("."));
      return story ? storyActivity(id, story) : null;
    }
    case "c": {
      const p = content.creative.find((x) => x.id === parts[1]);
      return p ? { id, track: "creativity", subject: "creativity", kind: "creative", title: p.title, description: "Draw or create something", icon: p.icon, difficulty: 1, minutes: 10, creative: p } : null;
    }
    case "h": {
      const h = content.habits.find((x) => x.id === parts[1]);
      return h ? { id, track: "habit", subject: "habits", kind: "habit", title: h.title, description: h.why, icon: h.icon, difficulty: 1, minutes: 5, habit: h } : null;
    }
    case "g": {
      const [, game, l, seed] = parts;
      const level = lvl(l);
      if (!level || !/^\d{1,9}$/.test(seed ?? "")) return null;
      const rng = createRng(`${child.id}|${id}`);
      const meta = GAMES.find((g) => g.id === game);
      if (!meta) return null;
      const base = { id, kind: "game" as const, title: meta.title, description: meta.description, icon: meta.icon, difficulty: level, minutes: 4 };
      if (game === "pattern") return { ...base, kind: "quiz", track: "brain", subject: "math", questions: brainQuestions(level, rng, id, 6) };
      if (game === "quickmath") return { ...base, kind: "quiz", track: "math", subject: "math", questions: quickMathQuestions(level, 8, rng, id) };
      if (game === "wordmatch") return { ...base, kind: "quiz", track: "english", subject: "english", questions: wordMatchQuestions(content.vocab, level, rng, id) };
      if (game === "memory") return { ...base, track: "brain", subject: "math" };
      return null;
    }
  }
  return null;
}
