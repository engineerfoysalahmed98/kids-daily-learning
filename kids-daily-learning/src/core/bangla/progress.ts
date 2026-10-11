/**
 * Guest progress for the Bangla number & math section — pure functions only.
 * The browser wrapper (src/state/bnGuestStore.ts) saves this in localStorage so
 * children can learn and earn stars without an account or email.
 *
 * Reward rules (kept deliberately calm):
 *  - one ⭐ per correct answer, but only the first time that exact problem is
 *    answered correctly (the question id is the key) — retrying or re-submitting
 *    never pays out twice;
 *  - badges for passing a level (≥ 60%) and for exploring all numbers;
 *  - no timers, no streak pressure, nothing lost for mistakes.
 */
import type { Question, Response } from "../types";
import { scoreAttempt } from "../engine/scoring";
import { BN_LEVELS, BN_TOPICS, isAgeGroup, LEVEL_NAME, type BnAgeGroup, type BnTopic } from "./levels";
import { NUMBER_GROUPS } from "./numbers";
import { OP_IDS, type OpId } from "./lessons";
import { parseQuizId, TOPIC_META } from "./quiz";

export const PASS_PCT = 60;
const MAX_STAR_KEYS = 5000;

export interface QuizRecord { attempts: number; bestPct: number; lastPct: number; lastAt: string }

export interface BnProgress {
  version: 1;
  ageGroup: BnAgeGroup | null;
  stars: number;
  /** Question ids that have already earned their star. */
  starKeys: string[];
  quizzes: Record<string, QuizRecord>;
  groupsSeen: number[];
  lessonsSeen: OpId[];
  badges: { id: string; at: string }[];
  /** Gentle sound effects on/off for this device. */
  soundOn: boolean;
}

export function emptyProgress(): BnProgress {
  return { version: 1, ageGroup: null, stars: 0, starKeys: [], quizzes: {}, groupsSeen: [], lessonsSeen: [], badges: [], soundOn: true };
}

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** Reads saved JSON defensively: anything unexpected falls back to a fresh start. */
export function parseProgress(raw: string | null | undefined): BnProgress {
  if (!raw) return emptyProgress();
  try {
    const d = JSON.parse(raw) as Partial<BnProgress>;
    if (!d || d.version !== 1) return emptyProgress();
    const quizzes: Record<string, QuizRecord> = {};
    for (const [k, v] of Object.entries(d.quizzes ?? {})) {
      if (parseQuizId(k) && v && isNum(v.attempts) && isNum(v.bestPct) && isNum(v.lastPct)) {
        quizzes[k] = { attempts: v.attempts, bestPct: v.bestPct, lastPct: v.lastPct, lastAt: String(v.lastAt ?? "") };
      }
    }
    return {
      version: 1,
      ageGroup: isAgeGroup(d.ageGroup) ? d.ageGroup : null,
      stars: isNum(d.stars) && d.stars >= 0 ? Math.floor(d.stars) : 0,
      starKeys: Array.isArray(d.starKeys) ? d.starKeys.filter((k): k is string => typeof k === "string").slice(-MAX_STAR_KEYS) : [],
      quizzes,
      groupsSeen: Array.isArray(d.groupsSeen) ? [...new Set(d.groupsSeen.filter((g) => isNum(g) && g >= 1 && g <= 10))] : [],
      lessonsSeen: Array.isArray(d.lessonsSeen) ? [...new Set(d.lessonsSeen.filter((x): x is OpId => OP_IDS.includes(x as OpId)))] : [],
      badges: Array.isArray(d.badges) ? d.badges.filter((b) => b && typeof b.id === "string" && BADGE_IDS.has(b.id)).map((b) => ({ id: b.id, at: String(b.at ?? "") })) : [],
      soundOn: typeof d.soundOn === "boolean" ? d.soundOn : true,
    };
  } catch {
    return emptyProgress();
  }
}

// ---------------------------------------------------------------- badges

export interface BnBadge { id: string; name: string; icon: string; description: string; test: (p: BnProgress) => boolean }

export function passed(p: BnProgress, quiz: string): boolean {
  return (p.quizzes[quiz]?.bestPct ?? 0) >= PASS_PCT;
}

const levelBadges: BnBadge[] = BN_TOPICS.flatMap((topic: BnTopic) => BN_LEVELS.map((level) => ({
  id: `bn-${topic}-${level}`,
  name: `${TOPIC_META[topic].bn} · ${LEVEL_NAME[level]} স্তর পার`,
  icon: TOPIC_META[topic].icon,
  description: `${TOPIC_META[topic].quizTitle} (${LEVEL_NAME[level]}) খেলায় ${PASS_PCT}% বা বেশি পাও।`,
  test: (p: BnProgress) => passed(p, `${topic}-${level}`),
})));

export const BN_BADGES: BnBadge[] = [
  { id: "bn-first-star", name: "প্রথম তারা", icon: "⭐", description: "প্রথম সঠিক উত্তর দাও।", test: (p) => p.stars >= 1 },
  { id: "bn-explorer", name: "১–১০০ অভিযাত্রী", icon: "🗺️", description: "১ থেকে ১০০ পর্যন্ত সব দল ঘুরে দেখো।", test: (p) => NUMBER_GROUPS.every((g) => p.groupsSeen.includes(g.id)) },
  { id: "bn-all-lessons", name: "চার কাজের বন্ধু", icon: "🧮", description: "যোগ, বিয়োগ, গুণ আর ভাগ — চারটি পাঠই পড়ো।", test: (p) => OP_IDS.every((o) => p.lessonsSeen.includes(o)) },
  ...levelBadges,
  { id: "bn-stars-25", name: "তারার ঝুড়ি", icon: "🌟", description: "মোট ২৫টি তারা জমাও।", test: (p) => p.stars >= 25 },
  { id: "bn-stars-100", name: "তারার আকাশ", icon: "🌌", description: "মোট ১০০টি তারা জমাও।", test: (p) => p.stars >= 100 },
];

const BADGE_IDS = new Set(BN_BADGES.map((b) => b.id));

function awardBadges(p: BnProgress, now: string): { progress: BnProgress; newBadges: BnBadge[] } {
  const have = new Set(p.badges.map((b) => b.id));
  const newBadges = BN_BADGES.filter((b) => !have.has(b.id) && b.test(p));
  if (!newBadges.length) return { progress: p, newBadges };
  return { progress: { ...p, badges: [...p.badges, ...newBadges.map((b) => ({ id: b.id, at: now }))] }, newBadges };
}

// ---------------------------------------------------------------- updates

export function setAgeGroup(p: BnProgress, ageGroup: BnAgeGroup | null): BnProgress {
  return { ...p, ageGroup };
}

export function markGroupSeen(p: BnProgress, groupId: number, now: string): { progress: BnProgress; newBadges: BnBadge[] } {
  if (groupId < 1 || groupId > 10 || p.groupsSeen.includes(groupId)) return { progress: p, newBadges: [] };
  return awardBadges({ ...p, groupsSeen: [...p.groupsSeen, groupId] }, now);
}

export function markLessonSeen(p: BnProgress, op: OpId, now: string): { progress: BnProgress; newBadges: BnBadge[] } {
  if (p.lessonsSeen.includes(op)) return { progress: p, newBadges: [] };
  return awardBadges({ ...p, lessonsSeen: [...p.lessonsSeen, op] }, now);
}

export interface QuizOutcome {
  progress: BnProgress;
  correct: number;
  total: number;
  pct: number;
  /** New stars earned by this attempt. */
  starsEarned: number;
  /** Correct answers whose star was already earned before. */
  alreadyRewarded: number;
  newBadges: BnBadge[];
  passed: boolean;
}

/**
 * Scores a finished quiz with the shared engine and updates guest progress.
 * Safe to call twice with the same answers: the second call adds no stars.
 */
export function recordQuiz(p: BnProgress, quiz: string, questions: Question[], responses: Record<string, Response>, now: string): QuizOutcome {
  const score = scoreAttempt(questions, responses);
  const owned = new Set(p.starKeys);
  const fresh: string[] = [];
  let alreadyRewarded = 0;
  for (const r of score.results) {
    if (!r.correct) continue;
    if (owned.has(r.questionId)) alreadyRewarded++;
    else { owned.add(r.questionId); fresh.push(r.questionId); }
  }
  const prev = p.quizzes[quiz];
  const record: QuizRecord = {
    attempts: (prev?.attempts ?? 0) + 1,
    bestPct: Math.max(prev?.bestPct ?? 0, score.pct),
    lastPct: score.pct,
    lastAt: now,
  };
  const updated: BnProgress = {
    ...p,
    stars: p.stars + fresh.length,
    starKeys: [...p.starKeys, ...fresh].slice(-MAX_STAR_KEYS),
    quizzes: parseQuizId(quiz) ? { ...p.quizzes, [quiz]: record } : p.quizzes,
  };
  const { progress, newBadges } = awardBadges(updated, now);
  return { progress, correct: score.correct, total: score.total, pct: score.pct, starsEarned: fresh.length, alreadyRewarded, newBadges, passed: score.pct >= PASS_PCT };
}

/** 1–3 rating stars for the result screen (finishing always earns one). */
export function ratingStars(pct: number): number {
  return pct >= 90 ? 3 : pct >= PASS_PCT ? 2 : 1;
}

/** Kind Bangla headline for a finished quiz. */
export function resultMessage(pct: number): { title: string; sub: string } {
  if (pct === 100) return { title: "দারুণ করেছ! সব ঠিক! 🎉", sub: "তুমি সত্যিই গণিতের তারা!" };
  if (pct >= 80) return { title: "চমৎকার! 🌟", sub: "প্রায় সবগুলোই ঠিক হয়েছে।" };
  if (pct >= PASS_PCT) return { title: "খুব ভালো! ⭐", sub: "আর একটু অনুশীলন করলেই সব ঠিক হবে।" };
  return { title: "ভালো চেষ্টা! 💪", sub: "ভুল করেই আমরা শিখি। আবার চেষ্টা করো!" };
}

export function badgeById(id: string): BnBadge | undefined {
  return BN_BADGES.find((b) => b.id === id);
}
