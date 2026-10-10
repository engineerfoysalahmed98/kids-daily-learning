"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useActivity } from "@/state/useChild";
import { useNav } from "@/nav/nav";
import { TRACK_META } from "@/core/content/meta";
import { createRng } from "@/core/engine";
import { ChildShell, useChildPrefs } from "@/ui/shells/ChildShell";
import { Blob, ProgressBar, Spinner } from "@/ui/primitives";
import { QuizRunner } from "@/ui/quiz/QuizRunner";
import { SpeakButton } from "@/ui/quiz/QuestionView";
import { TINT, toneOf } from "@/ui/colors";
import { canSpeak, playSfx, speak, stopSpeaking } from "@/ui/effects";
import { BackButton, NotFound, useSubmitCompletion } from "./shared";

function useCurrentActivity() {
  const { params } = useNav();
  return useActivity(params.id);
}

function Loading() { return <Spinner label="Opening your activity" />; }

// ---------------------------------------------------------------- Lesson

function LessonBody() {
  const { activity } = useCurrentActivity();
  const nav = useNav();
  const [i, setI] = useState(0);
  const cards = activity?.lesson ?? [];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((x) => Math.min(cards.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length]);
  if (activity === undefined) return <Loading />;
  if (activity === null || !cards.length) return <NotFound />;
  const tone = toneOf(TRACK_META[activity.track].color);
  const card = cards[i];
  const last = i === cards.length - 1;

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <BackButton />
      <header>
        <p className="label">{activity.icon} {TRACK_META[activity.track].label} lesson</p>
        <h1 className="text-3xl">{activity.title}</h1>
      </header>
      <ProgressBar value={i + 1} max={cards.length} label={`Card ${i + 1} of ${cards.length}`} tone={tone} size="sm" />
      <article key={i} className={`card grid animate-rise gap-4 p-6 text-center ${TINT[tone]} border-transparent`} aria-roledescription="lesson card" aria-label={`${i + 1} of ${cards.length}: ${card.title}`}>
        <span className="text-[5.5rem] leading-none" aria-hidden="true">{card.emoji}</span>
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-4xl">{card.title}</h2>
          <SpeakButton text={`${card.title}. ${card.body} ${card.example ?? ""}`} label={`Hear ${card.title}`} />
        </div>
        <p className="text-xl font-bold">{card.body}</p>
        {card.example && <p className="rounded-2xl bg-surface/80 px-4 py-3 text-lg italic text-muted">“{card.example}”</p>}
      </article>
      <div className="flex items-center gap-3">
        <button className="btn-secondary w-24" onClick={() => setI(i - 1)} disabled={i === 0} aria-label="Previous card">←</button>
        <div className="flex flex-1 justify-center gap-2" aria-hidden="true">
          {cards.map((_, k) => <span key={k} className={`h-2.5 rounded-full transition-all ${k === i ? "w-7 bg-ink" : "w-2.5 bg-line"}`} />)}
        </div>
        {last
          ? <button className="btn-primary" onClick={() => nav.go(`/quiz/${encodeURIComponent(activity.id)}`, { replace: true })}>Start quiz ✨</button>
          : <button className="btn-primary w-24" onClick={() => setI(i + 1)} aria-label="Next card">→</button>}
      </div>
    </div>
  );
}
export function LessonScreen() { return <ChildShell focus><LessonBody /></ChildShell>; }

// ---------------------------------------------------------------- Quiz

function QuizBody() {
  const { activity, childId } = useCurrentActivity();
  const { soundOn } = useChildPrefs();
  const nav = useNav();
  const { submit, submitting, error } = useSubmitCompletion(childId, activity?.id);
  if (activity === undefined) return <Loading />;
  if (activity === null || !activity.questions?.length) return <NotFound />;
  return (
    <>
      {error && <p role="alert" className="mx-auto mb-3 max-w-2xl rounded-2xl bg-oops/10 px-4 py-3 font-bold text-oops">{error}</p>}
      <QuizRunner activity={activity} soundOn={soundOn} submitting={submitting}
        onExit={() => nav.go("/home", { replace: true })}
        onFinish={(responses, seconds) => void submit({ kind: "quiz", responses, seconds })} />
    </>
  );
}
export function QuizScreen() { return <ChildShell focus><QuizBody /></ChildShell>; }

// ---------------------------------------------------------------- Story reader

function ReadBody() {
  const { activity, content } = useCurrentActivity();
  const nav = useNav();
  const [reading, setReading] = useState<number | null>(null);
  const cancelled = useRef(false);
  useEffect(() => () => { cancelled.current = true; stopSpeaking(); }, []);
  if (activity === undefined || !content) return <Loading />;
  const story = content.stories.find((s) => s.id === activity?.storyId);
  if (!activity || !story) return <NotFound what="story" />;

  function listen() {
    if (reading !== null) { cancelled.current = true; stopSpeaking(); setReading(null); return; }
    cancelled.current = false;
    const readFrom = (k: number) => {
      if (cancelled.current || k >= story!.paragraphs.length) { setReading(null); return; }
      setReading(k);
      document.getElementById(`para-${k}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      const ok = speak(k === 0 ? `${story!.title}. ${story!.paragraphs[0]}` : story!.paragraphs[k], { onEnd: () => readFrom(k + 1) });
      if (!ok) setReading(null);
    };
    readFrom(0);
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <BackButton fallback="/stories" />
      <div className={`grid aspect-[16/9] max-w-full place-items-center rounded-card ${TINT[toneOf(story.sceneColor)]}`} role="img" aria-label={`Illustration for ${story.title}`}>
        <span className="text-6xl tracking-[0.2em] sm:text-7xl" aria-hidden="true">{story.scene}</span>
      </div>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-3xl sm:text-4xl">{story.title}</h1>
        {canSpeak() && (
          <button className="btn-secondary" onClick={listen} aria-pressed={reading !== null}>{reading !== null ? "⏹ Stop" : "🔊 Listen to Story"}</button>
        )}
      </header>
      <div className="card grid gap-4 p-6 text-lg leading-relaxed sm:text-xl sm:leading-relaxed">
        {story.paragraphs.map((p, k) => (
          <p key={k} id={`para-${k}`} className={`rounded-xl transition-colors ${reading === k ? "bg-sun/30 px-2 -mx-2" : ""}`}>{p}</p>
        ))}
        <p className="rounded-2xl bg-science/15 px-4 py-3 font-bold"><span aria-hidden="true">💡 </span>{story.moral}</p>
      </div>
      <button className="btn-primary w-full" onClick={() => { stopSpeaking(); nav.go(`/quiz/${encodeURIComponent(activity.id)}`, { replace: true }); }}>
        Answer {story.questions.length} questions ✨
      </button>
    </div>
  );
}
export function ReadScreen() { return <ChildShell focus><ReadBody /></ChildShell>; }

// ---------------------------------------------------------------- Creative (drawing canvas)

const PALETTE = ["#1D2340", "#FF6F61", "#FFC53D", "#2FBF71", "#3AA0FF", "#8B5CF6", "#F0508C", "#8B5A2B", "#FFFFFF"];

function CreateBody() {
  const { activity, childId } = useCurrentActivity();
  const { soundOn } = useChildPrefs();
  const { submit, submitting, error } = useSubmitCompletion(childId, activity?.id);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [size, setSize] = useState(8);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [strokes, setStrokes] = useState(0);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const started = useRef(Date.now());

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth;
    c.width = w * ratio;
    c.height = w * 0.75 * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, w * 0.75);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [activity?.id]);

  if (activity === undefined) return <Loading />;
  if (activity === null || !activity.creative) return <NotFound />;
  const p = activity.creative;

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const ctx = () => canvasRef.current!.getContext("2d")!;
  function down(e: React.PointerEvent) {
    const c = canvasRef.current!;
    c.setPointerCapture(e.pointerId);
    setHistory((h) => [...h.slice(-15), ctx().getImageData(0, 0, c.width, c.height)]);
    drawing.current = true;
    last.current = pos(e);
    move(e);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current || !last.current) return;
    const g = ctx();
    const pt = pos(e);
    g.strokeStyle = color;
    g.lineWidth = size;
    g.beginPath();
    g.moveTo(last.current.x, last.current.y);
    g.lineTo(pt.x + 0.01, pt.y + 0.01);
    g.stroke();
    last.current = pt;
  }
  function up() { if (drawing.current) setStrokes((s) => s + 1); drawing.current = false; last.current = null; }
  function undo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    ctx().putImageData(prev, 0, 0);
    setHistory((h) => h.slice(0, -1));
    setStrokes((s) => Math.max(0, s - 1));
  }
  function clear() {
    const c = canvasRef.current!;
    setHistory((h) => [...h.slice(-15), ctx().getImageData(0, 0, c.width, c.height)]);
    const g = ctx();
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, c.width, c.height); g.restore();
    setStrokes(0);
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <BackButton />
      <header className="flex items-start gap-4">
        <Blob tone="creativity" emoji={p.icon} size="lg" />
        <div>
          <p className="label">🎨 Creativity</p>
          <h1 className="text-3xl">{p.title}</h1>
          <p className="mt-1 text-lg font-bold text-muted">{p.prompt}</p>
        </div>
      </header>
      <ul className="flex flex-wrap gap-2">{p.tips.map((t) => <li key={t} className="chip bg-creativity/15">💡 {t}</li>)}</ul>

      <div className="card grid gap-3 p-3">
        <canvas ref={canvasRef} className="aspect-[4/3] w-full touch-none rounded-2xl border-2 border-line bg-white" style={{ cursor: "crosshair" }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
          role="img" aria-label="Drawing canvas. Use a mouse, finger or stylus to draw." />
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Drawing tools">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Colors">
            {PALETTE.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c === "#FFFFFF" ? "Eraser (white)" : `Color ${c}`}
                onClick={() => { setColor(c); playSfx("tap", soundOn); }}
                className={`grid h-11 w-11 place-items-center rounded-full border-2 ${color === c ? "border-ink ring-4 ring-math/30" : "border-line"}`} style={{ background: c }}>
                {c === "#FFFFFF" && <span aria-hidden="true">🧽</span>}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Brush size">
            {[4, 8, 16].map((s) => (
              <button key={s} type="button" role="radio" aria-checked={size === s} aria-label={`Brush size ${s}`} onClick={() => setSize(s)}
                className={`grid h-11 w-11 place-items-center rounded-xl ${size === s ? "bg-sun/40" : "bg-sunken"}`}>
                <span className="rounded-full bg-ink" style={{ width: s + 2, height: s + 2 }} />
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            <button type="button" className="btn-secondary btn-sm" onClick={undo} disabled={!history.length}>↶ Undo</button>
            <button type="button" className="btn-secondary btn-sm" onClick={clear}>Clear</button>
          </div>
        </div>
      </div>
      <p className="text-sm font-bold text-muted">🔒 Your drawing stays on this device. Prefer paper? Draw there and tap “I&apos;m done!” when you finish.</p>
      {error && <p role="alert" className="font-bold text-oops">{error}</p>}
      <button className="btn-primary w-full" disabled={submitting} onClick={() => void submit({ kind: "done", seconds: Math.round((Date.now() - started.current) / 1000) })}>
        {submitting ? "Saving…" : strokes ? "I'm done! 🎨" : "I made it on paper! ✏️"}
      </button>
    </div>
  );
}
export function CreateScreen() { return <ChildShell focus><CreateBody /></ChildShell>; }

// ---------------------------------------------------------------- Good habit

function HabitBody() {
  const { activity, childId } = useCurrentActivity();
  const { soundOn } = useChildPrefs();
  const { submit, submitting, error } = useSubmitCompletion(childId, activity?.id);
  const [done, setDone] = useState<boolean[]>([]);
  const started = useRef(Date.now());
  if (activity === undefined) return <Loading />;
  if (activity === null || !activity.habit) return <NotFound />;
  const h = activity.habit;
  const checked = h.steps.map((_, i) => !!done[i]);
  const all = checked.every(Boolean);
  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <BackButton />
      <header className="grid place-items-center gap-2 text-center">
        <Blob tone="habit" emoji={h.icon} size="xl" />
        <p className="label">🌱 Good habit</p>
        <h1 className="text-3xl">{h.title}</h1>
        <p className="max-w-md font-bold text-muted">{h.why}</p>
      </header>
      <ProgressBar value={checked.filter(Boolean).length} max={h.steps.length} label="Steps done" tone="habit" />
      <ol className="grid gap-3">
        {h.steps.map((s, i) => (
          <li key={s}>
            <button type="button" aria-pressed={checked[i]}
              onClick={() => { setDone((d) => { const n = [...d]; n[i] = !n[i]; return n; }); playSfx(checked[i] ? "tap" : "correct", soundOn); }}
              className={`flex min-h-[64px] w-full items-center gap-4 rounded-2xl border-[3px] px-4 text-left text-lg font-bold transition ${checked[i] ? "border-good bg-good/10" : "border-line bg-surface hover:border-habit"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg ${checked[i] ? "bg-good text-white" : "bg-sunken"}`} aria-hidden="true">{checked[i] ? "✓" : i + 1}</span>
              <span className={checked[i] ? "line-through decoration-2 opacity-70" : ""}>{s}</span>
            </button>
          </li>
        ))}
      </ol>
      {error && <p role="alert" className="font-bold text-oops">{error}</p>}
      <button className="btn-primary w-full" disabled={!all || submitting} onClick={() => void submit({ kind: "done", seconds: Math.round((Date.now() - started.current) / 1000) })}>
        {submitting ? "Saving…" : all ? "I did it! 🌟" : `Tick all ${h.steps.length} steps to finish`}
      </button>
    </div>
  );
}
export function HabitScreen() { return <ChildShell focus><HabitBody /></ChildShell>; }

// ---------------------------------------------------------------- Memory game

const MEMORY_SETS = [["🐶", "🐱", "🐰", "🦊", "🐼", "🐸"], ["🍎", "🍌", "🍇", "🍓", "🍉", "🍍"], ["🚗", "🚀", "🚲", "⛵", "🚂", "🚁"]];

function MemoryBody() {
  const { activity, childId } = useCurrentActivity();
  const { soundOn } = useChildPrefs();
  const { submit, submitting } = useSubmitCompletion(childId, activity?.id);
  const pairs = activity ? (activity.difficulty <= 2 ? 4 : 6) : 4;
  const deck = useMemo(() => {
    if (!activity) return [];
    const rng = createRng(activity.id);
    const set = rng.pick(MEMORY_SETS).slice(0, pairs);
    return rng.shuffle([...set, ...set]).map((emoji, i) => ({ id: i, emoji }));
  }, [activity, pairs]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const started = useRef(Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open;
    if (deck[a].emoji === deck[b].emoji) {
      setMatched((m) => new Set(m).add(deck[a].emoji));
      setOpen([]);
      playSfx("correct", soundOn);
    } else {
      const t = setTimeout(() => setOpen([]), 900);
      return () => clearTimeout(t);
    }
  }, [open, deck, soundOn]);

  useEffect(() => { if (deck.length && matched.size === pairs) setFinished(true); }, [matched, pairs, deck.length]);

  if (activity === undefined) return <Loading />;
  if (activity === null) return <NotFound what="game" />;

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.has(deck[i].emoji)) return;
    playSfx("tap", soundOn);
    if (open.length === 1) setMoves((m) => m + 1);
    setOpen((o) => [...o, i]);
  };
  const pct = Math.max(40, Math.round(100 - Math.max(0, moves - pairs) * (100 / (pairs * 2))));

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <BackButton fallback="/games" />
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="label">🎮 Game</p>
          <h1 className="text-3xl">Memory Match</h1>
          <p className="font-bold text-muted">Find all {pairs} pairs. Take your time!</p>
        </div>
        <p className="chip tnum" aria-live="polite">{matched.size}/{pairs} pairs · {moves} tries</p>
      </header>
      <div className={`grid gap-3 ${pairs === 4 ? "grid-cols-4" : "grid-cols-4"}`}>
        {deck.map((card, i) => {
          const shown = open.includes(i) || matched.has(card.emoji);
          return (
            <button key={card.id} type="button" onClick={() => flip(i)} aria-label={shown ? card.emoji : `Card ${i + 1}, face down`} disabled={matched.has(card.emoji)}
              className={`grid aspect-square max-w-full place-items-center rounded-2xl border-[3px] text-4xl transition-all duration-200 sm:text-5xl ${shown ? (matched.has(card.emoji) ? "border-good bg-good/10" : "border-math bg-surface") : "border-transparent bg-story/80 hover:bg-story"}`}>
              <span aria-hidden="true">{shown ? card.emoji : "✦"}</span>
            </button>
          );
        })}
      </div>
      {finished && (
        <button className="btn-primary w-full animate-pop" disabled={submitting} onClick={() => void submit({ kind: "game", pct, seconds: Math.round((Date.now() - started.current) / 1000) })}>
          {submitting ? "Saving…" : "All pairs found! Collect stars ⭐"}
        </button>
      )}
    </div>
  );
}
export function MemoryScreen() { return <ChildShell focus><MemoryBody /></ChildShell>; }

