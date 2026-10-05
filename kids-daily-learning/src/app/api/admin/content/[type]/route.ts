import type { NextRequest } from "next/server";
import { z } from "zod";
import { body, HttpError, json, requireAdmin, route } from "@/server/http";
import { db } from "@/server/db";
import { fromQuestion, invalidateContent } from "@/server/content";
import type { Question } from "@/core/types";

type Ctx = { params: Promise<{ type: string }> };

const slug = z.string().min(1).max(80).regex(/^[\w-]+$/);
const text = (max: number) => z.string().trim().min(1).max(max);
const level = z.number().int().min(1).max(5);
const age = z.number().int().min(4).max(12);
const base = { id: text(160), prompt: text(300), explain: text(400), visual: z.string().max(60).optional(), speak: z.string().max(300).optional() };
const QuestionSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("mc"), options: z.array(text(160)).min(2).max(4), answer: z.number().int().min(0).max(3) }),
  z.object({ ...base, type: z.literal("tf"), answer: z.boolean() }),
  z.object({ ...base, type: z.literal("image"), options: z.array(z.object({ emoji: text(16), label: text(40) })).min(2).max(4), answer: z.number().int().min(0).max(3) }),
  z.object({ ...base, type: z.literal("match"), pairs: z.array(z.tuple([text(80), text(120)])).min(2).max(5) }),
  z.object({ ...base, type: z.literal("type"), accept: z.array(text(60)).min(1).max(5), inputMode: z.enum(["numeric", "text"]), placeholder: z.string().max(40).optional() }),
  z.object({ ...base, type: z.literal("order"), items: z.array(text(80)).min(2).max(8), sentence: z.boolean().optional() }),
]).refine((q) => q.type !== "mc" || q.answer < q.options.length, "Answer index out of range");
const Card = z.object({ emoji: text(16), title: text(80), body: text(400), example: z.string().max(200).optional() });

const SCHEMAS = {
  stories: z.array(z.object({ id: slug, title: text(80), minAge: age, maxAge: age, scene: text(40), sceneColor: text(20), paragraphs: z.array(text(1200)).min(1).max(12), moral: text(200), questions: z.array(QuestionSchema).min(1).max(6) })),
  units: z.array(z.object({ id: slug, subject: z.enum(["science", "gk"]), topic: text(40), title: text(80), icon: text(16), level, cards: z.array(Card).min(1).max(8), questions: z.array(QuestionSchema).min(1).max(10) })),
  vocab: z.array(z.object({ id: slug, word: text(30), emoji: text(16), meaning: text(160), example: text(200), level })),
  creative: z.array(z.object({ id: slug, title: text(80), prompt: text(400), icon: text(16), tips: z.array(text(120)).min(1).max(6), minAge: age })),
  habits: z.array(z.object({ id: slug, title: text(80), icon: text(16), why: text(300), steps: z.array(text(120)).min(1).max(8), minAge: age })),
  badges: z.array(z.object({ id: slug, name: text(40), icon: text(16), description: text(160), rule: z.record(z.unknown()) })),
  subjects: z.array(z.object({ id: z.enum(["english", "math", "science", "gk", "creativity", "habits"]), name: text(40), icon: text(16), color: text(20), enabled: z.boolean(), topics: z.array(text(40)).max(12) })),
  ageGroups: z.array(z.object({ id: slug, label: text(40), minAge: age, maxAge: age, baseLevel: level })),
} as const;

/** Replace one content collection. Admin only; validated; atomic. */
export const PUT = route<Ctx>(async (req: NextRequest, { params }) => {
  await requireAdmin();
  const type = (await params).type as keyof typeof SCHEMAS;
  const schema = SCHEMAS[type];
  if (!schema) throw new HttpError(404, "Unknown content type.");
  const items = (await body(req, schema as z.ZodTypeAny)) as Record<string, unknown>[];

  await db.$transaction(async (tx) => {
    switch (type) {
      case "stories":
        await tx.story.deleteMany({});
        for (const s of items as { id: string; title: string; minAge: number; maxAge: number; scene: string; sceneColor: string; paragraphs: string[]; moral: string; questions: Question[] }[]) {
          await tx.story.create({ data: { slug: s.id, title: s.title, minAge: s.minAge, maxAge: s.maxAge, scene: s.scene, sceneColor: s.sceneColor, paragraphs: s.paragraphs, moral: s.moral,
            questions: { create: s.questions.map((q, i) => ({ ...fromQuestion(q, i), slug: `${s.id}:${q.id}`, payload: fromQuestion(q, i).payload as never })) } } });
        }
        break;
      case "units":
        await tx.lesson.deleteMany({ where: { kind: "KNOWLEDGE_UNIT" } });
        for (const u of items as { id: string; subject: string; topic: string; title: string; icon: string; level: number; cards: unknown[]; questions: Question[] }[]) {
          await tx.lesson.create({ data: { slug: u.id, subjectId: u.subject, kind: "KNOWLEDGE_UNIT", title: u.title, icon: u.icon, topic: u.topic, level: u.level, data: u.cards as never,
            questions: { create: u.questions.map((q, i) => ({ ...fromQuestion(q, i), slug: `${u.id}:${q.id}`, payload: fromQuestion(q, i).payload as never })) } } });
        }
        break;
      case "vocab":
        await tx.lesson.deleteMany({ where: { kind: "VOCAB_WORD" } });
        await tx.lesson.createMany({ data: (items as { id: string; word: string; emoji: string; meaning: string; example: string; level: number }[]).map((w) => ({ slug: w.id, subjectId: "english", kind: "VOCAB_WORD" as const, title: w.word, icon: w.emoji, level: w.level, data: { meaning: w.meaning, example: w.example } })) });
        break;
      case "creative":
      case "habits": {
        const kind = type === "creative" ? "CREATIVE" : "HABIT";
        await tx.activity.deleteMany({ where: { kind } });
        await tx.activity.createMany({ data: items.map((a) => ({ slug: String(a.id), subjectId: type === "creative" ? "creativity" : "habits", kind, title: String(a.title), icon: String(a.icon),
          body: String(type === "creative" ? a.prompt : a.why), steps: (type === "creative" ? a.tips : a.steps) as string[], minAge: Number(a.minAge) })) });
        break;
      }
      case "badges":
        for (const [i, b] of items.entries()) {
          await tx.badge.upsert({ where: { id: String(b.id) }, create: { id: String(b.id), name: String(b.name), icon: String(b.icon), description: String(b.description), rule: b.rule as never, sortOrder: i },
            update: { name: String(b.name), icon: String(b.icon), description: String(b.description), rule: b.rule as never, sortOrder: i } });
        }
        break;
      case "subjects":
        for (const [i, s] of items.entries()) {
          await tx.subject.upsert({ where: { id: String(s.id) }, create: { id: String(s.id), name: String(s.name), icon: String(s.icon), color: String(s.color), enabled: Boolean(s.enabled), topics: s.topics as string[], sortOrder: i },
            update: { name: String(s.name), icon: String(s.icon), color: String(s.color), enabled: Boolean(s.enabled), topics: s.topics as string[], sortOrder: i } });
        }
        break;
      case "ageGroups":
        await tx.ageGroup.deleteMany({});
        await tx.ageGroup.createMany({ data: items.map((g) => ({ slug: String(g.id), label: String(g.label), minAge: Number(g.minAge), maxAge: Number(g.maxAge), baseLevel: Number(g.baseLevel) })) });
        break;
    }
  }, { timeout: 30_000 });
  invalidateContent();
  return json({ ok: true, count: items.length });
});
