"use client";
import { useCallback, useState } from "react";
import { toBn } from "@/core/bangla";
import {
  ALL_BN_LETTERS, BN_EXTRA_WORDS, BN_SECTIONS, BN_SENTENCES, bnLetterGuide, bnWordGuide, CONSONANTS, findSection, HUB, isDone, VOWELS, type BnLetter,
} from "@/core/hub";
import { Link, useNav } from "@/nav/nav";
import { useHubProgress } from "@/state/hubStore";
import { Modal } from "@/ui/primitives";
import { SpeakButton } from "@/ui/quiz/QuestionView";
import { TracingPad } from "@/ui/TracingPad";
import { DonePill, HubNotFound, HubShell, PageTitle, QuizCallout, useMarker } from "./shared";

const CARD_TONES = ["bg-english/15 border-english/40", "bg-math/15 border-math/40", "bg-science/15 border-science/40", "bg-story/15 border-story/40", "bg-creativity/15 border-creativity/40", "bg-gk/15 border-gk/40"];
const tone = (i: number) => CARD_TONES[i % CARD_TONES.length];

/** Big letter + picture + word + sentence. */
function LetterDetail({ l }: { l: BnLetter }) {
  const lg = bnLetterGuide(l.letter);
  const wg = bnWordGuide(l.word);
  return (
    <div className="grid justify-items-center gap-3 text-center">
      <p className="font-bangla text-[6rem] font-semibold leading-none">{l.letter}</p>
      <p className="text-6xl" aria-hidden="true">{l.emoji}</p>
      <p className="flex items-center gap-2 font-display text-3xl font-semibold">
        {l.letter} — {l.word}
        <SpeakButton text={`${l.letter}। ${l.word}। ${l.line}`} lang="bn" label={`${l.word} শুনে নাও`} />
      </p>
      <p className="text-lg font-bold">{l.line}</p>
      {lg && (
        <p className="rounded-2xl bg-math/10 px-3 py-2 font-bold">
          উচ্চারণ: <span lang="en">“{lg.name}” — {lg.sound}</span>
        </p>
      )}
      {wg && (
        <p className="font-semibold text-muted">
          {l.word} = <span lang="en">{wg.say} · English: {wg.en}</span>
        </p>
      )}
      {l.note && <p className="rounded-2xl bg-sunken px-3 py-2 text-sm font-semibold text-muted">💡 {l.note}</p>}
    </div>
  );
}

/** স্বরবর্ণ / ব্যঞ্জনবর্ণ: tap a letter to open its card. */
function LetterGrid({ letters }: { letters: BnLetter[] }) {
  const { progress } = useHubProgress();
  const { mark } = useMarker();
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const show = (i: number) => { setOpen(i); mark(`bn-letter:${letters[i].letter}`); };
  const cur = open === null ? null : letters[open];
  const done = letters.filter((l) => isDone(progress, `bn-letter:${l.letter}`)).length;
  return (
    <>
      <DonePill done={done} total={letters.length} lang="bn" />
      <p className="font-semibold text-muted">যেকোনো অক্ষরে চাপ দাও — ছবি, শব্দ আর ছোট্ট বাক্য দেখবে।</p>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {letters.map((l, i) => {
          const seen = isDone(progress, `bn-letter:${l.letter}`);
          return (
            <li key={l.letter}>
              <button type="button" onClick={() => show(i)} aria-label={`${l.letter} — ${l.word}${seen ? " (দেখা হয়েছে)" : ""}`}
                className={`relative grid w-full place-items-center gap-1 rounded-3xl border-[3px] p-3 transition hover:-translate-y-0.5 ${tone(i)}`}>
                <span className="font-bangla text-5xl font-semibold leading-tight">{l.letter}</span>
                <span className="text-sm font-bold"><span aria-hidden="true">{l.emoji}</span> {l.word}</span>
                {seen && <span className="absolute right-2 top-1 text-base" aria-hidden="true">✅</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <Modal open={cur !== null} onClose={close} title={cur ? `${cur.letter} অক্ষর` : undefined}>
        {cur && open !== null && (
          <div className="grid gap-4">
            <LetterDetail l={cur} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" disabled={open === 0} onClick={() => show(open - 1)}>← আগের</button>
              {open < letters.length - 1
                ? <button type="button" className="btn-primary" onClick={() => show(open + 1)}>পরের →</button>
                : <button type="button" className="btn-primary" onClick={close}>শেষ ✅</button>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/** অক্ষর চেনা: flip cards. */
function FlipCards() {
  const [set, setSet] = useState<"vowel" | "consonant">("vowel");
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const letters = set === "vowel" ? VOWELS : CONSONANTS;
  const toggle = (k: string) => setFlipped((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:w-fit" role="radiogroup" aria-label="কোন অক্ষর">
        {(["vowel", "consonant"] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={set === k} onClick={() => setSet(k)}
            className={`min-h-[48px] rounded-2xl border-[3px] px-4 font-display text-lg font-semibold ${set === k ? "border-english bg-english/15" : "border-line bg-surface"}`}>
            {k === "vowel" ? "স্বরবর্ণ" : "ব্যঞ্জনবর্ণ"}
          </button>
        ))}
      </div>
      <p className="font-semibold text-muted">কার্ডে চাপ দিলে উল্টে যাবে — অক্ষরটা কোন ছবির শব্দে আছে দেখো। আবার চাপলে ফিরে আসবে।</p>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {letters.map((l, i) => {
          const on = flipped.has(l.letter);
          return (
            <li key={l.letter}>
              <button type="button" aria-pressed={on} onClick={() => toggle(l.letter)}
                aria-label={on ? `${l.letter} — ${l.word}` : `${l.letter} কার্ড উল্টাও`}
                className={`grid aspect-[3/4] w-full place-items-center rounded-3xl border-[3px] p-2 text-center transition ${on ? "bg-surface border-sun" : tone(i)}`}>
                {on
                  ? <span className="grid gap-1"><span className="text-5xl" aria-hidden="true">{l.emoji}</span><span className="font-display text-lg font-semibold">{l.word}</span></span>
                  : <span className="font-bangla text-6xl font-semibold">{l.letter}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <QuizCallout quizId="bn-chena" lang="bn" title="মেলানোর খেলা" body="অক্ষর খুঁজে বের করো, অক্ষর আর ছবি মেলাও।" />
    </>
  );
}

/** অক্ষর লেখা: tracing pad with a letter picker. */
function Tracing() {
  const { progress } = useHubProgress();
  const { mark, toastNode } = useMarker();
  const [i, setI] = useState(0);
  const l = ALL_BN_LETTERS[i];
  const done = ALL_BN_LETTERS.filter((x) => isDone(progress, `trace:${x.letter}`)).length;
  const success = () => mark(`trace:${l.letter}`, { starKey: `trace:${l.letter}`, message: "সাবাশ! সুন্দর লিখেছ!" });
  return (
    <>
      <DonePill done={done} total={ALL_BN_LETTERS.length} lang="bn" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-3">
          <p className="flex items-center gap-2 font-display text-2xl font-semibold">
            <span className="font-bangla text-4xl">{l.letter}</span> — <span aria-hidden="true">{l.emoji}</span> {l.word}
            <SpeakButton text={`${l.letter}। ${l.word}`} lang="bn" label={`${l.letter} শুনে নাও`} />
          </p>
          <TracingPad key={l.letter} glyph={l.letter} lang="bn" onSuccess={success}
            onSelfReport={() => mark(`trace:${l.letter}`, { message: "খুব ভালো! কাগজে লেখাও দারুণ অনুশীলন।" })} />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>← আগের অক্ষর</button>
            <button type="button" className="btn-secondary" disabled={i === ALL_BN_LETTERS.length - 1} onClick={() => setI(i + 1)}>পরের অক্ষর →</button>
          </div>
        </div>
        <div className="grid content-start gap-2">
          <h2 className="text-xl">কোন অক্ষর লিখবে?</h2>
          <ul className="flex flex-wrap gap-2" aria-label="অক্ষর বাছো">
            {ALL_BN_LETTERS.map((x, j) => {
              const ok = isDone(progress, `trace:${x.letter}`);
              return (
                <li key={x.letter}>
                  <button type="button" onClick={() => setI(j)} aria-pressed={i === j} aria-label={`${x.letter}${ok ? " (লেখা হয়েছে)" : ""}`}
                    className={`relative grid h-14 w-14 place-items-center rounded-2xl border-[3px] font-bangla text-2xl font-semibold ${i === j ? "border-sun bg-sun/30" : ok ? "border-good/50 bg-good/15" : "border-line bg-surface"}`}>
                    {x.letter}
                    {ok && <span className="absolute -right-1 -top-1 text-xs" aria-hidden="true">✅</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-sm font-semibold text-muted">প্রতিটি অক্ষর প্রথমবার ঠিকঠাক লিখলে একটি ⭐ পাবে।</p>
        </div>
      </div>
      {toastNode}
    </>
  );
}

/** শব্দ শেখা: picture words. */
function PictureWords() {
  const words = [...ALL_BN_LETTERS.map((l) => ({ key: l.letter, head: l.letter, word: l.word, emoji: l.emoji })),
    ...BN_EXTRA_WORDS.map((w) => ({ key: w.word, head: "", word: w.word, emoji: w.emoji }))]
    .map((w) => ({ ...w, guide: bnWordGuide(w.word) }));
  return (
    <>
      <p className="font-semibold text-muted">ছবি দেখো, শব্দ পড়ো। 🔊 থাকলে শুনেও নিতে পারো।</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {words.map((w, i) => (
          <li key={w.key} className={`flex items-center gap-3 rounded-3xl border-[3px] p-3 ${tone(i)}`}>
            <span className="text-5xl" aria-hidden="true">{w.emoji}</span>
            <span className="min-w-0 flex-1">
              {w.head && <span className="block font-bangla text-lg font-bold text-muted">{w.head} —</span>}
              <span className="block font-display text-2xl font-semibold">{w.word}</span>
              {w.guide && <span className="block text-sm font-semibold text-muted" lang="en">{w.guide.say} · {w.guide.en}</span>}
            </span>
            <SpeakButton text={w.word} lang="bn" label={`${w.word} শুনে নাও`} />
          </li>
        ))}
      </ul>
      <QuizCallout quizId="bn-shobdo" lang="bn" title="ছবি দেখে শব্দ বলো" body="ছবির সাথে ঠিক শব্দ আর প্রথম অক্ষর মেলাও।" />
    </>
  );
}

/** শব্দ থেকে বাক্য: read short sentences. */
function Sentences() {
  const { progress } = useHubProgress();
  const { mark, toastNode } = useMarker();
  const done = BN_SENTENCES.filter((s) => isDone(progress, `bn-sentence:${s.id}`)).length;
  return (
    <>
      <DonePill done={done} total={BN_SENTENCES.length} lang="bn" />
      <p className="font-semibold text-muted">প্রতিটি শব্দ আলাদা করে পড়ো, তারপর পুরো বাক্য। পড়া হলে “পড়েছি” চাপো।</p>
      <ul className="grid gap-3">
        {BN_SENTENCES.map((s, i) => {
          const ok = isDone(progress, `bn-sentence:${s.id}`);
          return (
            <li key={s.id} className={`flex flex-wrap items-center gap-3 rounded-3xl border-[3px] p-4 ${tone(i)}`}>
              <span className="text-4xl" aria-hidden="true">{s.emoji}</span>
              <span className="grid min-w-0 flex-1 gap-1.5">
                <span className="flex flex-wrap gap-1.5" aria-hidden="true">
                  {s.words.map((w, j) => <span key={j} className="rounded-xl bg-surface px-2.5 py-1 font-display text-lg font-semibold">{w}</span>)}
                </span>
                <span className="font-display text-2xl font-semibold">{s.text}</span>
              </span>
              <SpeakButton text={s.text} lang="bn" label="বাক্যটি শুনে নাও" />
              <button type="button" className={ok ? "btn-ghost btn-sm" : "btn-secondary btn-sm"} aria-pressed={ok}
                onClick={() => mark(`bn-sentence:${s.id}`, { message: "চমৎকার পড়েছ! 📖" })}>
                {ok ? "✅ পড়েছি" : "পড়েছি"}
              </button>
            </li>
          );
        })}
      </ul>
      <QuizCallout quizId="bn-bakko" lang="bn" title="বাক্য সাজাও" body="এলোমেলো শব্দ সাজিয়ে বাক্য বানাও, ফাঁকা জায়গা পূরণ করো।" />
      {toastNode}
    </>
  );
}

export function BanglaSectionScreen() {
  const { params } = useNav();
  const section = findSection("bangla", params.section ?? "");
  if (!section) return <HubShell><HubNotFound /></HubShell>;
  const idx = BN_SECTIONS.indexOf(section);
  const next = BN_SECTIONS[idx + 1];
  return (
    <HubShell back={{ to: `${HUB}/bangla`, label: "বাংলা শিখি" }}>
      <PageTitle icon={section.icon} title={section.title} sub={section.description} />
      {section.id === "shoroborno" && <LetterGrid letters={VOWELS} />}
      {section.id === "byanjonborno" && <LetterGrid letters={CONSONANTS} />}
      {section.id === "chena" && <FlipCards />}
      {section.id === "lekha" && <Tracing />}
      {section.id === "shobdo" && <PictureWords />}
      {section.id === "bakko" && <Sentences />}
      {next
        ? <NextLink to={next.href} label={`পরের পাঠ: ${next.icon} ${next.title} →`} />
        : <NextLink to={`${HUB}/bangla`} label={`🎉 সব পাঠ দেখা শেষ! ${toBn(BN_SECTIONS.length)}টি পাঠের তালিকায় ফিরে যাও`} />}
    </HubShell>
  );
}

function NextLink({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="btn-secondary w-full sm:w-fit">{label}</Link>;
}
