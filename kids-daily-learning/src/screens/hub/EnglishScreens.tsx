"use client";
import { useCallback, useState } from "react";
import { ALPHABET, EN_SECTIONS, EN_SENTENCES, findSection, HUB, isDone, SPELLING_WORDS, type EnLetter } from "@/core/hub";
import { Link, useNav } from "@/nav/nav";
import { useHubProgress } from "@/state/hubStore";
import { Modal } from "@/ui/primitives";
import { SpeakButton } from "@/ui/quiz/QuestionView";
import { TracingPad } from "@/ui/TracingPad";
import { DonePill, HubNotFound, HubShell, PageTitle, QuizCallout, useMarker } from "./shared";

const CARD_TONES = ["bg-math/15 border-math/40", "bg-english/15 border-english/40", "bg-science/15 border-science/40", "bg-story/15 border-story/40", "bg-creativity/15 border-creativity/40", "bg-gk/15 border-gk/40"];
const tone = (i: number) => CARD_TONES[i % CARD_TONES.length];

/** Tappable A–Z grid; `mode` decides what the card shows and what is tracked. */
function AlphabetGrid({ mode }: { mode: "abc" | "phonics" }) {
  const { progress } = useHubProgress();
  const { mark } = useMarker();
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const key = (l: EnLetter) => (mode === "abc" ? `en-letter:${l.upper}` : `en-sound:${l.upper}`);
  const show = (i: number) => { setOpen(i); mark(key(ALPHABET[i])); };
  const cur = open === null ? null : ALPHABET[open];
  const done = ALPHABET.filter((l) => isDone(progress, key(l))).length;
  return (
    <>
      <DonePill done={done} total={ALPHABET.length} lang="en" />
      <p className="font-semibold text-muted">
        {mode === "abc" ? "Tap a letter to see its picture word. · অক্ষরে চাপ দাও, ছবি আর শব্দ দেখো।" : "Tap a letter to learn its sound. · অক্ষরে চাপ দাও, তার ধ্বনি শেখো।"}
      </p>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
        {ALPHABET.map((l, i) => {
          const seen = isDone(progress, key(l));
          return (
            <li key={l.upper}>
              <button type="button" onClick={() => show(i)} aria-label={`${l.upper} for ${l.word}${seen ? " (seen)" : ""}`}
                className={`relative grid w-full place-items-center gap-1 rounded-3xl border-[3px] p-3 transition hover:-translate-y-0.5 ${tone(i)}`}>
                <span className="font-display text-4xl font-semibold leading-tight">{l.upper}{l.lower}</span>
                <span className="text-sm font-bold">{mode === "abc" ? <><span aria-hidden="true">{l.emoji}</span> {l.word}</> : l.sound}</span>
                {seen && <span className="absolute right-2 top-1 text-base" aria-hidden="true">✅</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <Modal open={cur !== null} onClose={close} title={cur ? `${cur.upper} ${cur.lower}` : undefined}>
        {cur && open !== null && (
          <div className="grid gap-4">
            <div className="grid justify-items-center gap-2 text-center">
              <p className="font-display text-[5rem] font-semibold leading-none">{cur.upper} {cur.lower}</p>
              <p className="text-6xl" aria-hidden="true">{cur.emoji}</p>
              <p className="flex items-center gap-2 font-display text-3xl font-semibold">
                {cur.upper} is for {cur.word}
                <SpeakButton text={mode === "abc" ? `${cur.upper}. ${cur.upper} is for ${cur.word}.` : `${cur.word}. ${cur.word}.`} lang="en" label={`Hear ${cur.word}`} />
              </p>
              <p className="text-lg font-bold" lang="bn">বাংলা অর্থ: {cur.bn} · অক্ষরের নাম: “{cur.name}”</p>
              {mode === "phonics" && (
                <p className="rounded-2xl bg-math/10 px-4 py-2 text-lg font-bold">
                  Sound: <span className="font-display">{cur.sound}</span> <span lang="bn">— বাংলায় প্রায় “{cur.soundBn}”-এর মতো</span>
                </p>
              )}
              {cur.note && <p className="rounded-2xl bg-sunken px-3 py-2 text-sm font-semibold text-muted">💡 {cur.note}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" disabled={open === 0} onClick={() => show(open - 1)}>← Back</button>
              {open < ALPHABET.length - 1
                ? <button type="button" className="btn-primary" onClick={() => show(open + 1)}>Next →</button>
                : <button type="button" className="btn-primary" onClick={close}>Done ✅</button>}
            </div>
          </div>
        )}
      </Modal>
      <QuizCallout quizId={mode === "abc" ? "en-abc" : "en-phonics"} lang="en"
        title={mode === "abc" ? "Alphabet quiz" : "Sound quiz"}
        body={mode === "abc" ? "Find letters, letter order and picture words." : "Which letter makes that sound?"} />
    </>
  );
}

/** Uppercase and lowercase pairs, with tracing. */
function CaseScreen() {
  const { progress } = useHubProgress();
  const { mark, toastNode } = useMarker();
  const [i, setI] = useState(0);
  const [lower, setLower] = useState(false);
  const l = ALPHABET[i];
  const glyph = lower ? l.lower : l.upper;
  return (
    <>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-9" aria-label="Big and small letters">
        {ALPHABET.map((x, j) => (
          <li key={x.upper}>
            <button type="button" onClick={() => setI(j)} aria-pressed={i === j} aria-label={`Big ${x.upper}, small ${x.lower}`}
              className={`grid w-full place-items-center rounded-2xl border-[3px] py-2 font-display text-2xl font-semibold ${i === j ? "border-sun bg-sun/30" : tone(j)}`}>
              {x.upper}<span className="text-xl">{x.lower}</span>
            </button>
          </li>
        ))}
      </ul>
      <section className="card grid gap-4 p-5" aria-labelledby="trace-h">
        <h2 id="trace-h" className="text-2xl">Trace it ✍️ <span className="text-base font-bold text-muted" lang="bn">· আঙুল দিয়ে লেখো</span></h2>
        <div className="grid grid-cols-2 gap-2 sm:w-fit" role="radiogroup" aria-label="Letter size">
          {[false, true].map((lo) => (
            <button key={String(lo)} type="button" role="radio" aria-checked={lower === lo} onClick={() => setLower(lo)}
              className={`min-h-[48px] rounded-2xl border-[3px] px-4 font-display text-lg font-semibold ${lower === lo ? "border-math bg-math/15" : "border-line bg-surface"}`}>
              {lo ? `small ${l.lower}` : `BIG ${l.upper}`}
            </button>
          ))}
        </div>
        <TracingPad key={glyph} glyph={glyph} lang="en" font="display"
          onSuccess={() => mark(`trace-en:${glyph}`, { starKey: `trace-en:${glyph}`, message: "Great tracing!" })}
          onSelfReport={() => mark(`trace-en:${glyph}`, { message: "Well done! Writing on paper is great practice." })} />
        <p className="text-sm font-semibold text-muted">
          {isDone(progress, `trace-en:${glyph}`) ? "✅ You traced this one. " : ""}First good tracing of each letter earns a ⭐.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>← {i > 0 ? ALPHABET[i - 1].upper : ""}</button>
          <button type="button" className="btn-secondary" disabled={i === ALPHABET.length - 1} onClick={() => setI(i + 1)}>{i < 25 ? ALPHABET[i + 1].upper : ""} →</button>
        </div>
      </section>
      <QuizCallout quizId="en-case" lang="en" title="Match big and small" body="Match each big letter with its small letter." />
      {toastNode}
    </>
  );
}

function WordsScreen() {
  const words = [...ALPHABET.map((l) => ({ word: l.word, emoji: l.emoji, bn: l.bn })), ...SPELLING_WORDS.map((w) => ({ word: w.word, emoji: w.emoji, bn: w.bn }))];
  const seen = new Set<string>();
  const unique = words.filter((w) => { const k = w.word.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  return (
    <>
      <p className="font-semibold text-muted">Look, read and listen. · ছবি দেখো, শব্দ পড়ো, বাংলা অর্থ জানো।</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {unique.map((w, i) => (
          <li key={w.word} className={`flex items-center gap-3 rounded-3xl border-[3px] p-3 ${tone(i)}`}>
            <span className="text-5xl" aria-hidden="true">{w.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-2xl font-semibold">{w.word}</span>
              <span className="block font-bold text-muted" lang="bn">{w.bn}</span>
            </span>
            <SpeakButton text={w.word} lang="en" label={`Hear ${w.word}`} />
          </li>
        ))}
      </ul>
      <QuizCallout quizId="en-words" lang="en" title="Picture word quiz" body="Pick the word that matches the picture." />
    </>
  );
}

function SpellingScreen() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (w: string) => setHidden((s) => { const n = new Set(s); if (n.has(w)) n.delete(w); else n.add(w); return n; });
  return (
    <>
      <p className="font-semibold text-muted">Say each letter, then tap “Hide” and try to spell the word yourself. · বানান করে বলো, তারপর লুকিয়ে নিজে চেষ্টা করো।</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SPELLING_WORDS.map((w, i) => {
          const h = hidden.has(w.word);
          return (
            <li key={w.word} className={`flex flex-wrap items-center gap-3 rounded-3xl border-[3px] p-4 ${tone(i)}`}>
              <span className="text-5xl" aria-hidden="true">{w.emoji}</span>
              <span className="grid min-w-0 flex-1 gap-1">
                <span className="flex flex-wrap gap-1" aria-label={h ? `Hidden word, ${w.word.length} letters` : w.word.split("").join(", ")}>
                  {w.word.split("").map((c, j) => (
                    <span key={j} aria-hidden="true" className="grid h-11 w-10 place-items-center rounded-xl bg-surface font-display text-2xl font-semibold">{h ? "?" : c}</span>
                  ))}
                </span>
                <span className="font-bold text-muted" lang="bn">{w.bn}</span>
              </span>
              <SpeakButton text={w.word} lang="en" label={`Hear ${w.word}`} />
              <button type="button" className="btn-secondary btn-sm" aria-pressed={h} onClick={() => toggle(w.word)}>{h ? "Show" : "Hide"}</button>
            </li>
          );
        })}
      </ul>
      <QuizCallout quizId="en-spelling" lang="en" title="Spelling bee 🐝" body="Find the missing letter and the right spelling." />
    </>
  );
}

function ReadingScreen() {
  const { progress } = useHubProgress();
  const { mark, toastNode } = useMarker();
  const done = EN_SENTENCES.filter((s) => isDone(progress, `en-sentence:${s.id}`)).length;
  return (
    <>
      <DonePill done={done} total={EN_SENTENCES.length} lang="en" />
      <p className="font-semibold text-muted">Read each word, then the whole sentence. Tap “I read it” when you are done.</p>
      <ul className="grid gap-3">
        {EN_SENTENCES.map((s, i) => {
          const ok = isDone(progress, `en-sentence:${s.id}`);
          return (
            <li key={s.id} className={`flex flex-wrap items-center gap-3 rounded-3xl border-[3px] p-4 ${tone(i)}`}>
              <span className="text-4xl" aria-hidden="true">{s.emoji}</span>
              <span className="grid min-w-0 flex-1 gap-1">
                <span className="font-display text-2xl font-semibold">{s.text}</span>
                <span className="font-bold text-muted" lang="bn">{s.bn}</span>
              </span>
              <SpeakButton text={s.text} lang="en" label="Hear the sentence" />
              <button type="button" className={ok ? "btn-ghost btn-sm" : "btn-secondary btn-sm"} aria-pressed={ok}
                onClick={() => mark(`en-sentence:${s.id}`, { message: "Great reading! 📖" })}>
                {ok ? "✅ I read it" : "I read it"}
              </button>
            </li>
          );
        })}
      </ul>
      <QuizCallout quizId="en-reading" lang="en" title="Reading quiz" body="Build sentences and fill in the missing word." />
      {toastNode}
    </>
  );
}

export function EnglishSectionScreen() {
  const { params } = useNav();
  const section = findSection("english", params.section ?? "");
  if (!section) return <HubShell lang="en"><HubNotFound lang="en" /></HubShell>;
  const next = EN_SECTIONS[EN_SECTIONS.indexOf(section) + 1];
  return (
    <HubShell lang="en" back={{ to: `${HUB}/english`, label: "English Learning" }}>
      <PageTitle icon={section.icon} title={section.title} sub={section.description} />
      {section.id === "abc" && <AlphabetGrid mode="abc" />}
      {section.id === "phonics" && <AlphabetGrid mode="phonics" />}
      {section.id === "case" && <CaseScreen />}
      {section.id === "words" && <WordsScreen />}
      {section.id === "spelling" && <SpellingScreen />}
      {section.id === "reading" && <ReadingScreen />}
      <Link to={next ? next.href : `${HUB}/english`} className="btn-secondary w-full sm:w-fit">
        {next ? `Next: ${next.icon} ${next.title} →` : "🎉 All lessons done! Back to English Learning"}
      </Link>
    </HubShell>
  );
}
