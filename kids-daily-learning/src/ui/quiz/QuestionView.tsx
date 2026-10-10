"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MatchQuestion, OrderQuestion, Question, Response } from "@/core/types";
import { createRng } from "@/core/engine";
import { canSpeak, onVoicesChanged, speak, stopSpeaking, type SpeechLang } from "../effects";

export interface QuestionViewProps {
  q: Question;
  /** Set once the child has answered: locks input and shows right/wrong styling. */
  answered: { response: Response; correct: boolean } | null;
  onAnswer: (r: Response) => void;
  /** UI language for labels and read-aloud. Defaults to English. */
  lang?: SpeechLang;
}

const QV_TEXT = {
  en: { letters: "ABCD", correct: "correct answer", readQ: "Read the question aloud", trueL: "True", falseL: "False", yourAnswer: "Your answer", typeHere: "Type your answer", check: "Check" },
  bn: { letters: "কখগঘ", correct: "সঠিক উত্তর", readQ: "প্রশ্নটি পড়ে শোনাও", trueL: "ঠিক", falseL: "ভুল", yourAnswer: "তোমার উত্তর", typeHere: "উত্তর লেখো", check: "মিলিয়ে দেখো" },
} as const;

const MATCH_COLORS = ["bg-math/25 border-math", "bg-english/25 border-english", "bg-science/25 border-science", "bg-story/25 border-story", "bg-creativity/25 border-creativity"];

export function SpeakButton({ text, label = "Read aloud", lang = "en" }: { text: string; label?: string; lang?: SpeechLang }) {
  const [on, setOn] = useState(false);
  // Render only after mount (no server/client mismatch) and re-check when voices load.
  const [, setVoicesTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); const off = onVoicesChanged(() => setVoicesTick((t) => t + 1)); return () => { off(); stopSpeaking(); }; }, []);
  if (!mounted || !canSpeak(lang)) return null;
  return (
    <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sunken text-xl" aria-label={label} aria-pressed={on}
      onClick={() => { if (on) { stopSpeaking(); setOn(false); return; } stopSpeaking(); speak(text, { lang, onStart: () => setOn(true), onEnd: () => setOn(false) }); }}>
      <span aria-hidden="true">{on ? "⏹️" : "🔊"}</span>
    </button>
  );
}

export function QuestionView({ q, answered, onAnswer, lang = "en" }: QuestionViewProps) {
  const t = QV_TEXT[lang];
  return (
    <div className="grid gap-5">
      {q.visual && (
        <div className="grid min-h-[96px] place-items-center rounded-3xl bg-sunken px-4 py-5 text-center text-5xl leading-snug tracking-wider" aria-hidden="true">
          {q.visual}
        </div>
      )}
      <div className="flex items-start gap-3">
        <h2 className="flex-1 text-2xl leading-snug" id={`q-${q.id}`}>{q.prompt}</h2>
        <SpeakButton text={q.speak ?? q.prompt} label={t.readQ} lang={lang} />
      </div>
      {q.type === "mc" && <ChoiceList options={q.options} answer={q.answer} answered={answered} onPick={(i) => onAnswer({ type: "mc", choice: i })} labelledBy={`q-${q.id}`} t={t} />}
      {q.type === "image" && <PictureChoice q={q} answered={answered} onPick={(i) => onAnswer({ type: "image", choice: i })} />}
      {q.type === "tf" && <TrueFalse answer={q.answer} answered={answered} onPick={(v) => onAnswer({ type: "tf", value: v })} t={t} />}
      {q.type === "type" && <TypeAnswer key={q.id} q={q} answered={answered} onSubmit={(text) => onAnswer({ type: "type", text })} t={t} />}
      {q.type === "order" && <OrderAnswer key={q.id} q={q} answered={answered} onSubmit={(items) => onAnswer({ type: "order", items })} />}
      {q.type === "match" && <MatchAnswer key={q.id} q={q} answered={answered} onSubmit={(pairs) => onAnswer({ type: "match", pairs })} />}
    </div>
  );
}

function stateClass(isPicked: boolean, isRight: boolean, locked: boolean): string {
  if (!locked) return "border-line bg-surface hover:border-math hover:bg-math/5";
  if (isRight) return "border-good bg-good/15";
  if (isPicked) return "border-oops bg-oops/10";
  return "border-line bg-surface opacity-60";
}

type QvText = (typeof QV_TEXT)[keyof typeof QV_TEXT];

function ChoiceList({ options, answer, answered, onPick, labelledBy, t = QV_TEXT.en }: { options: string[]; answer: number; answered: QuestionViewProps["answered"]; onPick: (i: number) => void; labelledBy: string; t?: QvText }) {
  const picked = answered?.response.type === "mc" ? answered.response.choice : null;
  return (
    <div role="group" aria-labelledby={labelledBy} className="grid gap-3">
      {options.map((o, i) => (
        <button key={i} type="button" disabled={!!answered} onClick={() => onPick(i)}
          className={`flex min-h-[60px] items-center gap-3 rounded-2xl border-[3px] px-4 py-3 text-left text-lg font-bold transition ${stateClass(picked === i, i === answer, !!answered)}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sunken font-display text-base" aria-hidden="true">{t.letters[i]}</span>
          <span className="flex-1">{o}</span>
          {answered && i === answer && <span aria-label={t.correct}>✅</span>}
        </button>
      ))}
    </div>
  );
}

function PictureChoice({ q, answered, onPick }: { q: Extract<Question, { type: "image" }>; answered: QuestionViewProps["answered"]; onPick: (i: number) => void }) {
  const picked = answered?.response.type === "image" ? answered.response.choice : null;
  const showLabels = q.options.some((o) => o.label !== o.emoji);
  return (
    <div className={`grid gap-3 ${q.options.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
      {q.options.map((o, i) => (
        <button key={i} type="button" disabled={!!answered} onClick={() => onPick(i)} aria-label={o.label}
          className={`grid aspect-square max-w-full place-items-center content-center gap-1 rounded-3xl border-[3px] p-2 transition ${stateClass(picked === i, i === q.answer, !!answered)}`}>
          <span className="text-5xl leading-none sm:text-6xl" aria-hidden="true">{o.emoji}</span>
          {showLabels && <span className="text-sm font-extrabold text-muted">{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

function TrueFalse({ answer, answered, onPick, t = QV_TEXT.en }: { answer: boolean; answered: QuestionViewProps["answered"]; onPick: (v: boolean) => void; t?: QvText }) {
  const picked = answered?.response.type === "tf" ? answered.response.value : null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {[true, false].map((v) => (
        <button key={String(v)} type="button" disabled={!!answered} onClick={() => onPick(v)}
          className={`grid min-h-[110px] place-items-center gap-1 rounded-3xl border-[3px] text-xl font-extrabold transition ${stateClass(picked === v, v === answer, !!answered)}`}>
          <span className="text-4xl" aria-hidden="true">{v ? "👍" : "👎"}</span>
          {v ? t.trueL : t.falseL}
        </button>
      ))}
    </div>
  );
}

function TypeAnswer({ q, answered, onSubmit, t = QV_TEXT.en }: { q: Extract<Question, { type: "type" }>; answered: QuestionViewProps["answered"]; onSubmit: (t: string) => void; t?: QvText }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSubmit(text); }}>
      <label htmlFor={`type-${q.id}`} className="sr-only">{t.yourAnswer}</label>
      <input ref={ref} id={`type-${q.id}`} value={text} onChange={(e) => setText(e.target.value)} disabled={!!answered}
        inputMode={q.inputMode === "numeric" ? "numeric" : "text"} autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={40}
        placeholder={q.placeholder ?? t.typeHere}
        className={`field min-h-[64px] text-center font-display text-3xl ${answered ? (answered.correct ? "border-good bg-good/10" : "border-oops bg-oops/10") : ""}`} />
      {!answered && <button type="submit" className="btn-primary w-full" disabled={!text.trim()}>{t.check}</button>}
    </form>
  );
}

// ---------------------------------------------------------------- drag & drop ordering

function OrderAnswer({ q, answered, onSubmit }: { q: OrderQuestion; answered: QuestionViewProps["answered"]; onSubmit: (items: string[]) => void }) {
  const initial = useMemo(() => {
    const rng = createRng(q.id);
    let s = rng.shuffle(q.items);
    if (s.every((x, i) => x === q.items[i])) s = [...s.slice(1), s[0]];
    return s;
  }, [q]);
  const [items, setItems] = useState(initial);
  const [drag, setDrag] = useState<{ index: number; startY: number; dy: number } | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const locked = !!answered;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((prev) => { const next = prev.slice(); const [x] = next.splice(from, 1); next.splice(to, 0, x); return next; });
  };

  function onPointerDown(e: React.PointerEvent, index: number) {
    if (locked) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ index, startY: e.clientY, dy: 0 });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag || !listRef.current) return;
    const rows = Array.from(listRef.current.children) as HTMLElement[];
    const dy = e.clientY - drag.startY;
    const h = rows[drag.index]?.offsetHeight ?? 60;
    const step = Math.round(dy / (h + 10));
    const target = Math.max(0, Math.min(items.length - 1, drag.index + step));
    if (target !== drag.index) {
      move(drag.index, target);
      setDrag({ index: target, startY: drag.startY + (target - drag.index) * (h + 10), dy: dy - (target - drag.index) * (h + 10) });
    } else setDrag({ ...drag, dy });
  }
  const onPointerUp = () => setDrag(null);

  const correctAt = (i: number) => items[i] === q.items[i];

  return (
    <div className="grid gap-3">
      <p className="text-sm font-bold text-muted">Drag the cards (or use the arrows) to put them in order.</p>
      <ol ref={listRef} className="grid gap-2.5" aria-label="Items to put in order">
        {items.map((item, i) => (
          <li key={item}
            className={`flex min-h-[60px] touch-none select-none items-center gap-2 rounded-2xl border-[3px] bg-surface pl-3 pr-1.5 text-lg font-bold ${drag?.index === i ? "z-10 border-math shadow-soft" : "border-line"} ${locked ? (correctAt(i) ? "border-good bg-good/10" : "border-oops bg-oops/10") : ""}`}
            style={drag?.index === i ? { transform: `translateY(${drag.dy}px) scale(1.02)` } : undefined}
            onPointerDown={(e) => onPointerDown(e, i)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            <span className="grid h-8 w-8 shrink-0 cursor-grab place-items-center rounded-lg bg-sunken font-display text-base" aria-hidden="true">{i + 1}</span>
            <span className="flex-1">{item}</span>
            {!locked && (
              <span className="flex gap-1">
                <button type="button" className="grid h-11 w-11 place-items-center rounded-xl bg-sunken" aria-label={`Move ${item} up`} disabled={i === 0} onPointerDown={(e) => e.stopPropagation()} onClick={() => move(i, i - 1)}>▲</button>
                <button type="button" className="grid h-11 w-11 place-items-center rounded-xl bg-sunken" aria-label={`Move ${item} down`} disabled={i === items.length - 1} onPointerDown={(e) => e.stopPropagation()} onClick={() => move(i, i + 1)}>▼</button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {q.sentence && <p className="rounded-2xl bg-sunken px-4 py-3 text-lg" aria-live="polite">“{items.join(" ")}.”</p>}
      {!locked && <button type="button" className="btn-primary w-full" onClick={() => onSubmit(items)}>Check</button>}
    </div>
  );
}

// ---------------------------------------------------------------- matching

function MatchAnswer({ q, answered, onSubmit }: { q: MatchQuestion; answered: QuestionViewProps["answered"]; onSubmit: (pairs: Record<string, string>) => void }) {
  const rights = useMemo(() => createRng(q.id).shuffle(q.pairs.map((p) => p[1])), [q]);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const locked = !!answered;
  const colorOf = (left: string) => MATCH_COLORS[q.pairs.findIndex((p) => p[0] === left) % MATCH_COLORS.length];
  const leftFor = (right: string) => Object.keys(pairs).find((l) => pairs[l] === right) ?? null;

  function connect(left: string, right: string) {
    setPairs((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (next[k] === right) delete next[k];
      next[left] = right;
      return next;
    });
    setSelLeft(null);
  }

  const isRightCorrect = (left: string) => q.pairs.find((p) => p[0] === left)?.[1] === pairs[left];

  return (
    <div className="grid gap-4">
      <p className="text-sm font-bold text-muted">Tap a word on the left, then its match on the right. You can also drag.</p>
      <div className="grid grid-cols-2 gap-3">
        <ul className="grid content-start gap-2.5" aria-label="Left side">
          {q.pairs.map(([left]) => {
            const matched = pairs[left];
            return (
              <li key={left}>
                <button type="button" disabled={locked} aria-pressed={selLeft === left}
                  onClick={() => setSelLeft(selLeft === left ? null : left)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { const r = e.dataTransfer.getData("text/plain"); if (r) connect(left, r); }}
                  className={`flex min-h-[64px] w-full items-center rounded-2xl border-[3px] px-3 text-left text-base font-extrabold transition ${matched ? colorOf(left) : "border-line bg-surface"} ${selLeft === left ? "ring-4 ring-math/40" : ""} ${locked ? (isRightCorrect(left) ? "!border-good" : "!border-oops") : ""}`}>
                  <span className="flex-1">{left}</span>
                  {locked && <span aria-hidden="true">{isRightCorrect(left) ? "✅" : "🔁"}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="grid content-start gap-2.5" aria-label="Right side">
          {rights.map((right) => {
            const l = leftFor(right);
            return (
              <li key={right}>
                <button type="button" disabled={locked} draggable={!locked}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", right)}
                  onClick={() => selLeft && connect(selLeft, right)}
                  aria-label={l ? `${right}, matched with ${l}` : right}
                  className={`flex min-h-[64px] w-full items-center justify-center rounded-2xl border-[3px] px-3 text-center font-extrabold transition disabled:cursor-default ${l ? colorOf(l) : "border-dashed border-line bg-surface"} ${right.length <= 3 ? "text-4xl" : "text-base"} ${selLeft && !l ? "hover:border-math" : ""}`}>
                  {right}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {locked && !answered?.correct && (
        <ul className="grid gap-1 rounded-2xl bg-sunken p-3 text-sm font-bold">
          {q.pairs.map(([l, r]) => <li key={l}>{l} → {r}</li>)}
        </ul>
      )}
      {!locked && <button type="button" className="btn-primary w-full" disabled={Object.keys(pairs).length < q.pairs.length} onClick={() => onSubmit(pairs)}>Check</button>}
    </div>
  );
}
