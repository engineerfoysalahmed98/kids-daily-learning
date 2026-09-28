import "server-only";
import type { BadgeRule, ContentStore, KnowledgeUnit, LessonCard, Level, Question, SubjectId } from "@/core/types";
import { defaultContent } from "@/core/content";
import { db } from "./db";

/** DB Question row → engine Question (payload holds the type-specific fields). */
function toQuestion(q: { slug: string; type: string; prompt: string; visual: string | null; explain: string; payload: unknown }): Question {
  // Slugs are stored as "<parent>:<questionId>" to stay globally unique.
  const id = q.slug.includes(":") ? q.slug.slice(q.slug.indexOf(":") + 1) : q.slug;
  return { id, type: q.type, prompt: q.prompt, visual: q.visual ?? undefined, explain: q.explain, ...(q.payload as object) } as Question;
}

export function fromQuestion(q: Question, sortOrder: number) {
  const { id, type, prompt, visual, explain, ...payload } = q;
  return { slug: id, type, prompt, visual: visual ?? null, explain, payload, sortOrder };
}

let cached: { at: number; content: ContentStore } | null = null;
const TTL_MS = 60_000;

/**
 * Loads the curriculum from PostgreSQL (seeded from src/core/content by
 * prisma/seed.ts, then edited by admins). Falls back to the built-in content
 * for any table that is still empty. Cached for a minute per instance.
 */
export async function loadContent(force = false): Promise<ContentStore> {
  if (!force && cached && Date.now() - cached.at < TTL_MS) return cached.content;
  const base = defaultContent();
  const [subjects, ageGroups, lessons, stories, activities, badges] = await Promise.all([
    db.subject.findMany({ orderBy: { sortOrder: "asc" } }),
    db.ageGroup.findMany({ orderBy: { minAge: "asc" } }),
    db.lesson.findMany({ where: { published: true }, include: { questions: { orderBy: { sortOrder: "asc" } } } }),
    db.story.findMany({ where: { published: true }, include: { questions: { orderBy: { sortOrder: "asc" } } } }),
    db.activity.findMany({ where: { published: true } }),
    db.badge.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const content: ContentStore = {
    subjects: subjects.length ? subjects.map((s) => ({ id: s.id as SubjectId, name: s.name, icon: s.icon, color: s.color, enabled: s.enabled, topics: s.topics })) : base.subjects,
    ageGroups: ageGroups.length ? ageGroups.map((g) => ({ id: g.slug, label: g.label, minAge: g.minAge, maxAge: g.maxAge, baseLevel: g.baseLevel as Level })) : base.ageGroups,
    vocab: lessons.some((l) => l.kind === "VOCAB_WORD")
      ? lessons.filter((l) => l.kind === "VOCAB_WORD").map((l) => {
        const d = l.data as { meaning: string; example: string };
        return { id: l.slug, word: l.title, emoji: l.icon, meaning: d.meaning, example: d.example, level: l.level as Level };
      })
      : base.vocab,
    units: lessons.some((l) => l.kind === "KNOWLEDGE_UNIT")
      ? lessons.filter((l) => l.kind === "KNOWLEDGE_UNIT").map((l): KnowledgeUnit => ({
        id: l.slug, subject: l.subjectId === "gk" ? "gk" : "science", topic: l.topic ?? "", title: l.title, icon: l.icon,
        level: l.level as Level, cards: l.data as unknown as LessonCard[], questions: l.questions.map(toQuestion),
      }))
      : base.units,
    stories: stories.length
      ? stories.map((s) => ({ id: s.slug, title: s.title, minAge: s.minAge, maxAge: s.maxAge, scene: s.scene, sceneColor: s.sceneColor, paragraphs: s.paragraphs, moral: s.moral, questions: s.questions.map(toQuestion) }))
      : base.stories,
    creative: activities.some((a) => a.kind === "CREATIVE")
      ? activities.filter((a) => a.kind === "CREATIVE").map((a) => ({ id: a.slug, title: a.title, prompt: a.body, icon: a.icon, tips: a.steps, minAge: a.minAge }))
      : base.creative,
    habits: activities.some((a) => a.kind === "HABIT")
      ? activities.filter((a) => a.kind === "HABIT").map((a) => ({ id: a.slug, title: a.title, why: a.body, icon: a.icon, steps: a.steps, minAge: a.minAge }))
      : base.habits,
    badges: badges.length ? badges.map((b) => ({ id: b.id, name: b.name, icon: b.icon, description: b.description, rule: b.rule as unknown as BadgeRule })) : base.badges,
  };
  cached = { at: Date.now(), content };
  return content;
}

export function invalidateContent() { cached = null; }
