import type { AgeGroup, BadgeDef, Subject, Track, SubjectId } from "../types";

export const SUBJECTS: Subject[] = [
  {
    id: "english", name: "English", icon: "🔤", color: "english", enabled: true,
    topics: ["Alphabet", "Vocabulary", "Grammar", "Reading", "Spelling", "Sentence building"],
  },
  {
    id: "math", name: "Mathematics", icon: "🔢", color: "math", enabled: true,
    topics: ["Numbers", "Addition", "Subtraction", "Multiplication", "Division", "Fractions", "Geometry", "Logic"],
  },
  {
    id: "science", name: "Science", icon: "🔬", color: "science", enabled: true,
    topics: ["Animals", "Plants", "Human body", "Space", "Environment", "Simple experiments"],
  },
  {
    id: "gk", name: "General Knowledge", icon: "🌍", color: "gk", enabled: true,
    topics: ["Countries", "Animals", "Nature", "Famous places", "Basic history", "Everyday knowledge"],
  },
  {
    id: "creativity", name: "Creativity", icon: "🎨", color: "creativity", enabled: true,
    topics: ["Drawing", "Coloring", "Story creation", "Craft ideas", "Music activities"],
  },
  {
    id: "habits", name: "Good Habits", icon: "🌱", color: "habit", enabled: true,
    topics: ["Brush teeth", "Wash hands", "Clean room", "Organize toys", "Drink water", "Help parents", "Respect others"],
  },
];

export const AGE_GROUPS: AgeGroup[] = [
  { id: "sprouts", label: "Sprouts", minAge: 4, maxAge: 5, baseLevel: 1 },
  { id: "seedlings", label: "Seedlings", minAge: 6, maxAge: 7, baseLevel: 2 },
  { id: "saplings", label: "Saplings", minAge: 8, maxAge: 8, baseLevel: 3 },
  { id: "trees", label: "Tall Trees", minAge: 9, maxAge: 10, baseLevel: 4 },
  { id: "forest", label: "Forest Rangers", minAge: 11, maxAge: 12, baseLevel: 5 },
];

export const TRACK_META: Record<Track, { label: string; icon: string; subject: SubjectId; color: string; progressLabel: string }> = {
  english: { label: "English", icon: "🔤", subject: "english", color: "english", progressLabel: "English" },
  math: { label: "Math", icon: "🔢", subject: "math", color: "math", progressLabel: "Math" },
  science: { label: "Science", icon: "🔬", subject: "science", color: "science", progressLabel: "Science" },
  gk: { label: "World", icon: "🌍", subject: "gk", color: "gk", progressLabel: "World" },
  story: { label: "Story", icon: "📖", subject: "english", color: "story", progressLabel: "Reading" },
  brain: { label: "Brain Game", icon: "🧠", subject: "math", color: "brain", progressLabel: "Logic" },
  creativity: { label: "Creativity", icon: "🎨", subject: "creativity", color: "creativity", progressLabel: "Creativity" },
  habit: { label: "Good Habit", icon: "🌱", subject: "habits", color: "habit", progressLabel: "Habits" },
};

/**
 * Badges. Rules are data so admins can tune thresholds; the engine evaluates them.
 * Rewards celebrate effort and consistency — there is no loss, no timer pressure
 * and nothing to buy.
 */
export const BADGES: BadgeDef[] = [
  { id: "first-activity", name: "First Activity", icon: "🌟", description: "Finish your very first activity.", rule: { kind: "activities", count: 1 } },
  { id: "learning-starter", name: "Learning Starter", icon: "📚", description: "Finish 5 activities.", rule: { kind: "activities", count: 5 } },
  { id: "streak-3", name: "3 Day Streak", icon: "🔥", description: "Learn 3 days in a row.", rule: { kind: "streak", days: 3 } },
  { id: "streak-7", name: "7 Day Streak", icon: "🚀", description: "Learn 7 days in a row.", rule: { kind: "streak", days: 7 } },
  { id: "brain-master", name: "Brain Master", icon: "🧠", description: "Finish 5 brain games.", rule: { kind: "track", track: "brain", count: 5 } },
  { id: "math-explorer", name: "Math Explorer", icon: "🔢", description: "Finish 5 math activities.", rule: { kind: "track", track: "math", count: 5 } },
  { id: "word-wizard", name: "Word Wizard", icon: "🔤", description: "Finish 5 English activities.", rule: { kind: "track", track: "english", count: 5 } },
  { id: "creative-kid", name: "Creative Kid", icon: "🎨", description: "Finish 3 creative activities.", rule: { kind: "track", track: "creativity", count: 3 } },
  { id: "habit-hero", name: "Good Habit Hero", icon: "🌱", description: "Finish 5 good-habit challenges.", rule: { kind: "track", track: "habit", count: 5 } },
  { id: "story-lover", name: "Story Lover", icon: "📖", description: "Read 3 stories.", rule: { kind: "track", track: "story", count: 3 } },
  { id: "science-star", name: "Science Star", icon: "🔬", description: "Finish 3 science activities.", rule: { kind: "track", track: "science", count: 3 } },
  { id: "perfect-score", name: "Super Score", icon: "💯", description: "Get every answer right in a quiz.", rule: { kind: "perfect", count: 1 } },
  { id: "goal-getter", name: "Goal Getter", icon: "🎯", description: "Reach your daily goal 3 times.", rule: { kind: "goal-days", count: 3 } },
  { id: "streak-14", name: "14 Day Streak", icon: "🌈", description: "Learn 14 days in a row.", rule: { kind: "streak", days: 14 } },
  { id: "xp-500", name: "Star Collector", icon: "⚡", description: "Earn 500 XP.", rule: { kind: "xp", amount: 500 } },
  { id: "streak-30", name: "30 Day Streak", icon: "🏅", description: "Learn 30 days in a row.", rule: { kind: "streak", days: 30 } },
];

export const AVATARS = ["🦁", "🐼", "🦊", "🐸", "🐯", "🐨", "🦄", "🐙", "🐧", "🦖", "🐢", "🐝"];
