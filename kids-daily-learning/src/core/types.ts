/**
 * Kids Daily Learning — shared domain types.
 * Framework-agnostic: used by the learning engine, the UI, the mock data
 * service and the server (API routes + Prisma mapping).
 */

/** Curriculum subjects (spec §5). */
export type SubjectId = "english" | "math" | "science" | "gk" | "creativity" | "habits";

/**
 * A "track" is a lane in Today's Adventure. Story and Brain are tracks that
 * belong to a subject (English/Reading and Math/Logic) but are shown on their own.
 */
export type Track = "english" | "math" | "science" | "gk" | "story" | "brain" | "creativity" | "habit";

/** Tracks that produce a quiz score and therefore a mastery percentage. */
export const SCORED_TRACKS: Track[] = ["english", "math", "science", "gk", "story", "brain"];
export const ALL_TRACKS: Track[] = ["english", "math", "science", "gk", "story", "brain", "creativity", "habit"];

export type Level = 1 | 2 | 3 | 4 | 5;

export type ActivityKind = "lesson-quiz" | "quiz" | "story" | "creative" | "habit" | "game";

// ---------------------------------------------------------------- Questions

interface QuestionBase {
  id: string;
  prompt: string;
  /** Big emoji "illustration" shown above the prompt (image-based questions). */
  visual?: string;
  /** Very simple explanation shown after answering. */
  explain: string;
  /** Text read aloud for pre-readers (defaults to prompt). */
  speak?: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "mc";
  options: string[];
  answer: number;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: "tf";
  answer: boolean;
}

/** Picture choice: options are emoji tiles with an accessible label. */
export interface ImageQuestion extends QuestionBase {
  type: "image";
  options: { emoji: string; label: string }[];
  answer: number;
}

export interface MatchQuestion extends QuestionBase {
  type: "match";
  /** Correct pairs [left, right]. The UI shuffles the right column. */
  pairs: [string, string][];
}

export interface TypeQuestion extends QuestionBase {
  type: "type";
  /** Accepted answers, compared case/space-insensitively. */
  accept: string[];
  inputMode: "numeric" | "text";
  placeholder?: string;
}

/** Drag-and-drop ordering: `items` is the correct order. */
export interface OrderQuestion extends QuestionBase {
  type: "order";
  items: string[];
  /** Whether items read as a sentence (joined with spaces) in feedback. */
  sentence?: boolean;
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ImageQuestion
  | MatchQuestion
  | TypeQuestion
  | OrderQuestion;

export type QuestionType = Question["type"];

export type Response =
  | { type: "mc"; choice: number }
  | { type: "tf"; value: boolean }
  | { type: "image"; choice: number }
  | { type: "match"; pairs: Record<string, string> }
  | { type: "type"; text: string }
  | { type: "order"; items: string[] };

// ---------------------------------------------------------------- Content

export interface LessonCard {
  emoji: string;
  title: string;
  body: string;
  /** e.g. an example sentence. */
  example?: string;
}

export interface Subject {
  id: SubjectId;
  name: string;
  icon: string;
  color: string; // CSS color token name, e.g. "english"
  enabled: boolean;
  topics: string[];
}

export interface AgeGroup {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  baseLevel: Level;
}

export interface VocabWord {
  id: string;
  word: string;
  emoji: string;
  meaning: string;
  example: string;
  level: Level;
}

/** A science or general-knowledge unit: fact cards + questions. */
export interface KnowledgeUnit {
  id: string;
  subject: "science" | "gk";
  topic: string;
  title: string;
  icon: string;
  level: Level;
  cards: LessonCard[];
  questions: Question[];
}

export interface Story {
  id: string;
  title: string;
  minAge: number;
  maxAge: number;
  /** Emoji scene used as the illustration placeholder. */
  scene: string;
  sceneColor: string;
  paragraphs: string[];
  moral: string;
  questions: Question[];
}

export interface CreativePrompt {
  id: string;
  title: string;
  prompt: string;
  icon: string;
  tips: string[];
  minAge: number;
}

export interface HabitChallenge {
  id: string;
  title: string;
  icon: string;
  why: string;
  steps: string[];
  minAge: number;
}

export interface ContentStore {
  subjects: Subject[];
  ageGroups: AgeGroup[];
  vocab: VocabWord[];
  units: KnowledgeUnit[];
  stories: Story[];
  creative: CreativePrompt[];
  habits: HabitChallenge[];
  badges: BadgeDef[];
}

// ---------------------------------------------------------------- Activities

export interface Activity {
  /** Deterministic id — the engine can rebuild the activity from it. */
  id: string;
  track: Track;
  subject: SubjectId;
  kind: ActivityKind;
  title: string;
  description: string;
  icon: string;
  difficulty: Level;
  minutes: number;
  lesson?: LessonCard[];
  questions?: Question[];
  storyId?: string;
  creative?: CreativePrompt;
  habit?: HabitChallenge;
}

// ---------------------------------------------------------------- Gamification

export type BadgeRule =
  | { kind: "activities"; count: number }
  | { kind: "track"; track: Track; count: number }
  | { kind: "streak"; days: number }
  | { kind: "perfect"; count: number; track?: Track }
  | { kind: "goal-days"; count: number }
  | { kind: "xp"; amount: number };

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  rule: BadgeRule;
}

export interface EarnedBadge {
  badgeId: string;
  unlockedAt: string; // ISO
}

export interface StreakState {
  current: number;
  longest: number;
  lastDay: string | null; // YYYY-MM-DD
}

// ---------------------------------------------------------------- People

export type AvatarId = string; // emoji avatar — no photos of children are ever stored

export interface ChildSettings {
  /** Activities per day that count as "goal complete". */
  dailyGoal: number;
  /** 0 = no limit. */
  screenTimeMinutes: number;
  allowedTracks: Track[];
  aiEnabled: boolean;
  soundOn: boolean;
  largeText: boolean;
}

/**
 * Child profile. Deliberately minimal: a display name (nickname is fine),
 * an age and an emoji avatar. No birthday, surname, school, photo or location.
 */
export interface Child {
  id: string;
  parentId: string;
  name: string;
  age: number;
  avatar: AvatarId;
  createdAt: string;
  settings: ChildSettings;
}

export interface NotificationPrefs {
  activity: boolean;
  badge: boolean;
  goal: boolean;
}

export interface Parent {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  notifications: NotificationPrefs;
  hasPin: boolean;
  role: "PARENT" | "ADMIN";
}

// ---------------------------------------------------------------- Records

export interface Completion {
  id: string;
  childId: string;
  activityId: string;
  track: Track;
  subject: SubjectId;
  title: string;
  icon: string;
  day: string; // YYYY-MM-DD (child's local day)
  completedAt: string; // ISO
  correct: number;
  total: number;
  /** null for creative / habit activities (no score). */
  scorePct: number | null;
  stars: number;
  xp: number;
  seconds: number;
  repeat: boolean;
}

/** "safety" is always on: sent when Buddy detects a child may be upset or unsafe. */
export type NotificationKind = "activity" | "badge" | "goal" | "safety";

export interface ParentNotification {
  id: string;
  parentId: string;
  childId: string;
  kind: NotificationKind;
  text: string;
  createdAt: string;
  read: boolean;
}

/** Everything the engine needs to know about one child's progress. */
export interface ChildProgress {
  child: Child;
  completions: Completion[];
  badges: EarnedBadge[];
  streak: StreakState;
  /** seconds used per day, keyed by YYYY-MM-DD */
  usage: Record<string, number>;
}

export interface ChildSummary {
  xp: number;
  stars: number;
  streak: StreakState;
  badges: number;
  activitiesCompleted: number;
  todayDone: number;
  goal: number;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
}

export interface ScoreResult {
  correct: number;
  total: number;
  pct: number;
  results: QuestionResult[];
}

export interface CompletionResult {
  completion: Completion;
  score: ScoreResult | null;
  xpAwarded: number;
  stars: number;
  newBadges: BadgeDef[];
  streak: StreakState;
  streakChanged: "started" | "extended" | "same" | "restarted";
  goalReachedNow: boolean;
  summary: ChildSummary;
}
