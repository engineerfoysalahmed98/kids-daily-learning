"use client";
import { useEffect, useRef, useState } from "react";
import { canSpeak, onVoicesChanged, speak, stopSpeaking, prefersReducedMotion, type SpeechLang } from "./effects";

const TEXT = {
  bn: {
    start: "▶️ লাইন ধরে পড়ি", prev: "← আগের", next: "পরের →", finish: "পড়া শেষ ✅", again: "🔁 আবার প্রথম থেকে",
    play: "🔊 শুনি", pause: "⏸️ থামাও", resume: "🔊 আবার শুনি",
    noVoice: "এই ডিভাইসে বাংলা কণ্ঠ নেই, তাই শোনা যাবে না — লাইন ধরে নিজে পড়ো, বা বড় কাউকে পড়ে শোনাতে বলো।",
    line: (i: number, n: number) => `লাইন ${toBn(i)} / ${toBn(n)}`,
    para: (i: number, n: number) => `অংশ ${toBn(i)} / ${toBn(n)}`,
    tapHint: "যেকোনো লাইনে চাপ দিলে সেটা উজ্জ্বল হবে।",
    controls: "পড়ার নিয়ন্ত্রণ",
  },
  en: {
    start: "▶️ Read line by line", prev: "← Back", next: "Next →", finish: "I finished reading ✅", again: "🔁 Start again",
    play: "🔊 Listen", pause: "⏸️ Pause", resume: "🔊 Keep listening",
    noVoice: "Read-aloud isn't available on this device — read along line by line, or ask a grown-up to read with you.",
    line: (i: number, n: number) => `Line ${i} of ${n}`,
    para: (i: number, n: number) => `Part ${i} of ${n}`,
    tapHint: "Tap any line to light it up.",
    controls: "Reading controls",
  },
} as const;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function toBn(n: number): string { return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]); }

/**
 * Read-along: highlights one line (or paragraph) at a time. Stepping with
 * the buttons always works; the 🔊 play/pause button only appears when the
 * device has a voice for the language, so no button is ever broken.
 */
export function ReadAlong({ lines, lang, kind = "poem", onFinished }: {
  lines: string[];
  lang: SpeechLang;
  kind?: "poem" | "story";
  onFinished?: () => void;
}) {
  const t = TEXT[lang];
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, setVoiceTick] = useState(0);
  const runId = useRef(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  useEffect(() => {
    setMounted(true);
    const off = onVoicesChanged(() => setVoiceTick((n) => n + 1));
    return () => { off(); runId.current++; stopSpeaking(); };
  }, []);

  // Text changed (different poem/story): reset.
  useEffect(() => { runId.current++; stopSpeaking(); setPlaying(false); setActive(-1); }, [lines]);

  useEffect(() => {
    if (active < 0) return;
    refs.current[active]?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [active]);

  const voice = mounted && canSpeak(lang);
  const n = lines.length;

  function finish() {
    runId.current++;
    stopSpeaking();
    setPlaying(false);
    finishedRef.current?.();
  }

  function speakFrom(i: number) {
    const id = ++runId.current;
    stopSpeaking();
    setActive(i);
    setPlaying(true);
    const ok = speak(lines[i], {
      lang,
      onEnd: () => {
        if (runId.current !== id) return; // paused, skipped or replaced
        if (i + 1 < n) speakFrom(i + 1);
        else { setPlaying(false); finishedRef.current?.(); }
      },
    });
    if (!ok) setPlaying(false);
  }

  function pause() { runId.current++; stopSpeaking(); setPlaying(false); }

  function go(i: number) {
    if (playing) pause();
    setActive(Math.max(0, Math.min(n - 1, i)));
  }

  const label = kind === "poem" ? t.line : t.para;

  return (
    <div className="grid gap-4">
      <div className={`grid gap-1 rounded-3xl bg-surface p-4 sm:p-6 ${kind === "poem" ? "text-center" : ""}`}>
        {lines.map((l, i) => (
          <button type="button" key={i} ref={(el) => { refs.current[i] = el; }}
            aria-current={i === active ? "true" : undefined}
            onClick={() => go(i)}
            className={`block w-full rounded-2xl ${kind === "poem" ? "text-center" : "text-left"} px-3 py-1.5 transition-colors ${kind === "poem" ? "font-display text-xl leading-relaxed sm:text-2xl" : "text-lg leading-relaxed sm:text-xl"} ${i === active ? "bg-sun/35 font-semibold" : active >= 0 ? "opacity-70" : ""}`}>
            {l}
          </button>
        ))}
      </div>
      <p className="text-center text-sm font-bold text-muted">{active >= 0 ? label(active + 1, n) : t.tapHint}</p>

      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t.controls}>
        {voice && (playing
          ? <button type="button" className="btn-primary" onClick={pause}>{t.pause}</button>
          : <button type="button" className="btn-primary" onClick={() => speakFrom(active >= 0 && active < n - 1 ? active : 0)}>{active > 0 ? t.resume : t.play}</button>)}
        {active < 0
          ? <button type="button" className={voice ? "btn-secondary" : "btn-primary"} onClick={() => go(0)}>{t.start}</button>
          : (
            <>
              <button type="button" className="btn-secondary" onClick={() => go(active - 1)} disabled={active === 0}>{t.prev}</button>
              {active < n - 1
                ? <button type="button" className="btn-secondary" onClick={() => go(active + 1)}>{t.next}</button>
                : <button type="button" className="btn-secondary" onClick={finish}>{t.finish}</button>}
              <button type="button" className="btn-ghost btn-sm" onClick={() => go(0)}>{t.again}</button>
            </>
          )}
      </div>
      {mounted && !voice && <p className="rounded-2xl bg-sunken px-4 py-2 text-center text-sm font-semibold text-muted">{t.noVoice}</p>}
    </div>
  );
}
