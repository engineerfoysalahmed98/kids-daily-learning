/**
 * Seeds the curriculum from src/core/content into PostgreSQL, plus an
 * optional demo family when SEED_DEMO=1 (development only).
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultContent } from "../src/core/content";
import { fromQuestionPlain } from "./seedUtil";

const db = new PrismaClient();

async function main() {
  const c = defaultContent();
  for (const [i, s] of c.subjects.entries()) {
    await db.subject.upsert({ where: { id: s.id }, create: { ...s, sortOrder: i }, update: { ...s, sortOrder: i } });
  }
  await db.ageGroup.deleteMany({});
  await db.ageGroup.createMany({ data: c.ageGroups.map((g) => ({ slug: g.id, label: g.label, minAge: g.minAge, maxAge: g.maxAge, baseLevel: g.baseLevel })) });
  for (const [i, b] of c.badges.entries()) {
    await db.badge.upsert({ where: { id: b.id }, create: { ...b, rule: b.rule as never, sortOrder: i }, update: { name: b.name, icon: b.icon, description: b.description, rule: b.rule as never, sortOrder: i } });
  }
  await db.lesson.deleteMany({});
  for (const w of c.vocab) {
    await db.lesson.create({ data: { slug: w.id, subjectId: "english", kind: "VOCAB_WORD", title: w.word, icon: w.emoji, level: w.level, data: { meaning: w.meaning, example: w.example } } });
  }
  for (const u of c.units) {
    await db.lesson.create({ data: { slug: u.id, subjectId: u.subject, kind: "KNOWLEDGE_UNIT", title: u.title, icon: u.icon, topic: u.topic, level: u.level, data: u.cards as never,
      questions: { create: u.questions.map((q, i) => fromQuestionPlain(u.id, q, i)) } } });
  }
  await db.story.deleteMany({});
  for (const s of c.stories) {
    await db.story.create({ data: { slug: s.id, title: s.title, minAge: s.minAge, maxAge: s.maxAge, scene: s.scene, sceneColor: s.sceneColor, paragraphs: s.paragraphs, moral: s.moral,
      questions: { create: s.questions.map((q, i) => fromQuestionPlain(s.id, q, i)) } } });
  }
  await db.activity.deleteMany({});
  await db.activity.createMany({ data: [
    ...c.creative.map((p) => ({ slug: p.id, subjectId: "creativity", kind: "CREATIVE" as const, title: p.title, icon: p.icon, body: p.prompt, steps: p.tips, minAge: p.minAge })),
    ...c.habits.map((h) => ({ slug: h.id, subjectId: "habits", kind: "HABIT" as const, title: h.title, icon: h.icon, body: h.why, steps: h.steps, minAge: h.minAge })),
  ] });

  if (process.env.SEED_DEMO === "1") {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo accounts in production.");
    const email = "demo@kidsdaily.app";
    await db.user.deleteMany({ where: { email } });
    await db.user.create({ data: { email, role: "ADMIN", passwordHash: await bcrypt.hash("learn2day", 12),
      parent: { create: { displayName: "Sam", settings: { create: {} }, children: { create: [
        { name: "Ayaan", age: 7, avatar: "🦁", settings: { create: {} }, streak: { create: {} } },
        { name: "Maya", age: 10, avatar: "🦊", settings: { create: { screenTimeMinutes: 60 } }, streak: { create: {} } },
      ] } } } } });
    console.log("Demo login: demo@kidsdaily.app / learn2day");
  }
  console.log("Seeded curriculum:", { vocab: c.vocab.length, units: c.units.length, stories: c.stories.length, badges: c.badges.length });
}

main().finally(() => db.$disconnect());
