"use client";
import { useEffect, useState } from "react";
import {
  compute, equationText, markLessonSeen, OBJECTS, OP_IDS, OP_LESSONS, repeatedAddition, SIGN, storySentence, suggestedLevel,
  timesTable, toBn, type BnBadge, type BnLevel, type BnObject, type OpId, type WorkedExample,
} from "@/core/bangla";
import { Link, useNav } from "@/nav/nav";
import { getBnProgress, updateBnProgress, useBnProgress } from "@/state/bnGuestStore";
import { SpeakButton } from "@/ui/quiz/QuestionView";
import { Blob } from "@/ui/primitives";
import { BadgeList, BanglaShell, BnNotFound, HUB, LevelTabs, ObjectGroup } from "./shared";

// ---------------------------------------------------------------- pictures

/** The picture for one equation, using real groups of objects. */
export function OpPicture({ op, a, b, obj }: { op: OpId; a: number; b: number; obj: BnObject }) {
  const r = compute(op, a, b);
  const label = `${equationText(op, a, b)} — ${storySentence(op, a, b, obj)}`;
  const big = "font-display text-3xl font-semibold";
  return (
    <div role="img" aria-label={label} className="flex flex-wrap items-center justify-center gap-3 rounded-3xl bg-sunken p-4">
      {op === "add" && (<>
        <ObjectGroup emoji={obj.emoji} count={a} />
        <span className={big} aria-hidden="true">+</span>
        <ObjectGroup emoji={obj.emoji} count={b} />
        <span className={big} aria-hidden="true">=</span>
        <ObjectGroup emoji={obj.emoji} count={r} className="rounded-2xl bg-good/15 p-1" />
      </>)}
      {op === "sub" && (<>
        <ObjectGroup emoji={obj.emoji} count={a} faded={b} />
        <span className={big} aria-hidden="true">→</span>
        <ObjectGroup emoji={obj.emoji} count={r} className="rounded-2xl bg-good/15 p-1" />
      </>)}
      {op === "mul" && (<>
        {Array.from({ length: a }, (_, i) => (
          <span key={i} className="rounded-2xl border-2 border-dashed border-math/60 p-1.5" aria-hidden="true">
            <ObjectGroup emoji={obj.emoji} count={b} />
          </span>
        ))}
        <span className={big} aria-hidden="true">= {toBn(r)}</span>
      </>)}
      {op === "div" && (<>
        {Array.from({ length: b }, (_, i) => (
          <span key={i} className="grid place-items-center gap-1 rounded-2xl bg-surface p-2" aria-hidden="true">
            <span className="text-3xl">🧒</span>
            <ObjectGroup emoji={obj.emoji} count={r} />
          </span>
        ))}
      </>)}
    </div>
  );
}

function ExampleCard({ op, ex, index }: { op: OpId; ex: WorkedExample; index: number }) {
  const sentence = storySentence(op, ex.a, ex.b, ex.obj, ex.kid);
  return (
    <article className="card grid gap-3 p-4 sm:p-5">
      <p className="label">উদাহরণ {toBn(index + 1)}</p>
      <OpPicture op={op} a={ex.a} b={ex.b} obj={ex.obj} />
      <p className="text-center font-display text-4xl font-semibold tnum">{equationText(op, ex.a, ex.b)}</p>
      {op === "mul" && <p className="text-center font-bold text-muted">মানে: {repeatedAddition(ex.a, ex.b)}</p>}
      <p className="flex items-start gap-2 text-lg font-bold"><span className="flex-1">{sentence}</span><SpeakButton text={sentence} lang="bn" label="বাক্যটি পড়ে শোনাও" /></p>
    </article>
  );
}

// ---------------------------------------------------------------- try it yourself

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="grid gap-1">
      <span className="text-sm font-extrabold text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary btn-sm w-12 px-0 text-2xl" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`${label} — কমাও`}>−</button>
        <output className="min-w-[3rem] text-center font-display text-3xl font-semibold tnum" aria-live="polite">{toBn(value)}</output>
        <button type="button" className="btn-secondary btn-sm w-12 px-0 text-2xl" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`${label} — বাড়াও`}>+</button>
      </div>
    </div>
  );
}

function TryItYourself({ op }: { op: OpId }) {
  const [x, setX] = useState(op === "div" ? 2 : 3);
  const [y, setY] = useState(2);
  const [objIndex, setObjIndex] = useState(0);
  const obj = OBJECTS[objIndex % OBJECTS.length];
  // a, b for the equation. For ভাগ the child picks children (x) and each one's share (y).
  const a = op === "div" ? x * y : x;
  const b = op === "div" ? x : op === "sub" ? Math.min(y, x) : y;
  const limits = {
    add: { x: [0, 10], y: [0, 10], xl: `প্রথম দলে কয়টি ${obj.name}?`, yl: `আরও কয়টি ${obj.name} এল?` },
    sub: { x: [1, 10], y: [0, x], xl: `কয়টি ${obj.name} ছিল?`, yl: "কয়টি সরিয়ে নিলে?" },
    mul: { x: [1, 5], y: [1, 5], xl: "কয়টি দল?", yl: "প্রতিটি দলে কয়টি?" },
    div: { x: [1, 5], y: [1, 5], xl: "কতজন শিশু?", yl: "প্রত্যেকে কয়টি পাবে?" },
  }[op];
  const sentence = storySentence(op, a, b, obj);
  return (
    <section className="card grid gap-4 border-sun/60 p-5" aria-labelledby="try">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="try" className="text-2xl">নিজে করে দেখো 🧪</h2>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setObjIndex((i) => i + 1)}>অন্য ছবি {OBJECTS[(objIndex + 1) % OBJECTS.length].emoji}</button>
      </div>
      <div className="flex flex-wrap gap-6">
        <Stepper label={limits.xl} value={x} min={limits.x[0]} max={limits.x[1]} onChange={(v) => { setX(v); if (op === "sub" && y > v) setY(v); }} />
        <Stepper label={limits.yl} value={op === "sub" ? b : y} min={limits.y[0]} max={limits.y[1]} onChange={setY} />
      </div>
      <OpPicture op={op} a={a} b={b} obj={obj} />
      <p className="text-center font-display text-4xl font-semibold tnum" aria-live="polite">{toBn(a)} {SIGN[op]} {toBn(b)} = {toBn(compute(op, a, b))}</p>
      <p className="text-center font-bold">{sentence}</p>
    </section>
  );
}

// ---------------------------------------------------------------- নামতা

function TimesTables() {
  const [n, setN] = useState(2);
  const [hide, setHide] = useState(false);
  const [shown, setShown] = useState<Set<number>>(new Set());
  return (
    <section className="card grid gap-4 p-5" aria-labelledby="tables">
      <h2 id="tables" className="text-2xl">নামতা ২ থেকে ১০ 📋</h2>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="কোন সংখ্যার নামতা">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
          <button key={k} type="button" role="radio" aria-checked={n === k} onClick={() => { setN(k); setShown(new Set()); }}
            className={`min-h-[48px] min-w-[48px] rounded-2xl border-[3px] font-display text-xl font-semibold ${n === k ? "border-math bg-math/15" : "border-line bg-surface"}`}>{toBn(k)}</button>
        ))}
      </div>
      <label className="flex min-h-[44px] w-fit cursor-pointer items-center gap-2 font-bold">
        <input type="checkbox" className="h-6 w-6" checked={hide} onChange={(e) => { setHide(e.target.checked); setShown(new Set()); }} />
        অনুশীলন: উত্তর লুকাও (চাপ দিলে দেখাবে)
      </label>
      <ol className="grid gap-2 sm:grid-cols-2">
        {timesTable(n).map((row) => {
          const visible = !hide || shown.has(row.b);
          return (
            <li key={row.b}>
              <button type="button" disabled={visible} onClick={() => setShown((s) => new Set(s).add(row.b))}
                className="flex min-h-[52px] w-full items-center justify-between rounded-2xl bg-sunken px-4 font-display text-2xl font-semibold tnum disabled:cursor-default">
                <span>{toBn(row.a)} × {toBn(row.b)} =</span>
                <span className={visible ? "text-math" : "text-muted"}>{visible ? toBn(row.product) : "?"}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------- page

function LessonBody() {
  const { params } = useNav();
  const op = params.op as OpId;
  const lesson = OP_IDS.includes(op) ? OP_LESSONS[op] : null;
  const { progress } = useBnProgress();
  const [level, setLevel] = useState<BnLevel>(1);
  const [badges, setBadges] = useState<BnBadge[]>([]);

  useEffect(() => { if (lesson) setLevel(suggestedLevel(progress.ageGroup, lesson.id)); }, [lesson, progress.ageGroup]);
  useEffect(() => {
    if (!lesson) return;
    const r = markLessonSeen(getBnProgress(), lesson.id, new Date().toISOString());
    if (r.progress !== getBnProgress()) updateBnProgress(() => r.progress);
    setBadges(r.newBadges);
  }, [lesson]);

  if (!lesson) return <BnNotFound />;
  const intro = lesson.intro.join(" ");
  return (
    <>
      <section className="flex items-center gap-4">
        <Blob tone={lesson.tone} emoji={lesson.icon} size="xl" />
        <div className="min-w-0">
          <h1 className="text-4xl">{lesson.bn} <span className="text-xl font-bold text-muted" lang="en">· {lesson.en}</span></h1>
          <p className="text-sm font-extrabold text-muted">ছবি দেখে, গুনে গুনে শিখি</p>
        </div>
      </section>

      <section className="card grid gap-2 p-5" aria-labelledby="what">
        <div className="flex items-start gap-2">
          <h2 id="what" className="flex-1 text-2xl">{lesson.bn} কী?</h2>
          <SpeakButton text={`${intro} ${lesson.signNote}`} lang="bn" label="ব্যাখ্যাটি পড়ে শোনাও" />
        </div>
        {lesson.intro.map((line) => <p key={line} className="text-xl font-bold">{line}</p>)}
        <p className="rounded-2xl bg-sunken px-4 py-2 text-lg font-bold">{lesson.signNote}</p>
      </section>

      <BadgeList badges={badges} />

      <section aria-labelledby="examples" className="grid gap-3">
        <h2 id="examples" className="text-2xl">ছবিতে দেখো 👀</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {lesson.examples.map((ex, i) => <ExampleCard key={i} op={lesson.id} ex={ex} index={i} />)}
        </div>
      </section>

      <TryItYourself key={lesson.id} op={lesson.id} />
      {lesson.id === "mul" && <TimesTables />}

      <p className="rounded-2xl bg-science/15 px-4 py-3 text-lg font-bold">💡 মনে রাখার কৌশল: {lesson.tip}</p>

      <section className="card grid gap-4 p-5" aria-labelledby="practice">
        <h2 id="practice" className="text-2xl">এবার খেলি! 🎮</h2>
        <p className="text-muted">ছোট্ট খেলা — প্রতিটি সঠিক উত্তরে একটি ⭐। ভুল হলে চিন্তা নেই, উত্তর দেখে শিখে নেব।</p>
        <LevelTabs value={level} onChange={setLevel} best={(l) => progress.quizzes[`${lesson.id}-${l}`]?.bestPct} />
        <Link to={`${HUB}/quiz/${lesson.id}-${level}`} className="btn-primary w-full">{lesson.bn}ের খেলা শুরু করো ▶</Link>
      </section>

      <nav aria-label="অন্য পাঠ" className="flex flex-wrap gap-2">
        {OP_IDS.filter((o) => o !== lesson.id).map((o) => (
          <Link key={o} to={`${HUB}/learn/${o}`} className="btn-secondary btn-sm">{OP_LESSONS[o].icon} {OP_LESSONS[o].bn}</Link>
        ))}
        <Link to={`${HUB}/numbers`} className="btn-secondary btn-sm">🔢 সংখ্যা</Link>
      </nav>
    </>
  );
}

export function BnLessonScreen() {
  return <BanglaShell back={{ to: HUB, label: "বাংলা গণিত" }}><LessonBody /></BanglaShell>;
}
