"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Activity, Response } from "@/core/types";
import { toBn } from "@/core/bangla";
import { buildHubQuiz, HUB, quizBackHref, quizSection, recordHubQuiz, type HubQuiz, type HubQuizOutcome } from "@/core/hub";
import { Link, useNav } from "@/nav/nav";
import { useBnProgress } from "@/state/bnGuestStore";
import { getHubProgress, updateHubProgress } from "@/state/hubStore";
import { QuizRunner } from "@/ui/quiz/QuizRunner";
import { Spinner, Stars } from "@/ui/primitives";
import { confetti, playSfx } from "@/ui/effects";
import { HubNotFound, HubShell, num, type Lang } from "./shared";

function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toActivity(q: HubQuiz, icon: string): Activity {
  return {
    id: `hub.${q.id}`, track: q.lang === "en" ? "english" : "story", subject: "english", kind: "quiz",
    title: q.title, description: "", icon, difficulty: 1, minutes: 3, questions: q.questions,
  };
}

function rating(pct: number): number { return pct >= 90 ? 3 : pct >= 60 ? 2 : pct > 0 ? 1 : 0; }

const MSG = {
  bn: {
    great: { title: "অসাধারণ! 🎉", sub: "তুমি দারুণ শিখেছ!" },
    good: { title: "খুব ভালো! 🌟", sub: "আরেকবার খেললে আরও তারা পাবে।" },
    try: { title: "চেষ্টা চালিয়ে যাও! 💪", sub: "আবার পাঠটা দেখে নাও, তারপর খেলো — তুমি পারবে।" },
    correct: (c: number, t: number) => `${toBn(t)}টির মধ্যে ${toBn(c)}টি সঠিক`,
    newStars: "নতুন তারা", total: "মোট তারা",
    already: (n: number) => `${toBn(n)}টি প্রশ্নের তারা আগেই পেয়েছিলে। নতুন প্রশ্নে আরও তারা পাবে!`,
    retry: "🔁 আবার খেলো", back: "📖 পাঠে ফিরে যাও", hub: "🏠 শিখি পাতা", making: "কুইজ তৈরি হচ্ছে",
  },
  en: {
    great: { title: "Amazing! 🎉", sub: "You really learned this!" },
    good: { title: "Well done! 🌟", sub: "Play again to collect more stars." },
    try: { title: "Keep going! 💪", sub: "Look at the lesson again, then try — you can do it." },
    correct: (c: number, t: number) => `${c} of ${t} correct`,
    newStars: "New stars", total: "All my stars",
    already: (n: number) => `You already earned stars for ${n} of these questions. New questions give more stars!`,
    retry: "🔁 Play again", back: "📖 Back to the lesson", hub: "🏠 Learn page", making: "Making your quiz",
  },
} as const;

function Result({ quiz, outcome, onRetry, icon }: { quiz: HubQuiz; outcome: HubQuizOutcome; onRetry: () => void; icon: string }) {
  const lang: Lang = quiz.lang;
  const t = MSG[lang];
  const m = outcome.pct >= 90 ? t.great : outcome.passed ? t.good : t.try;
  const { progress: bn } = useBnProgress();
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    if (outcome.passed) confetti();
    playSfx(outcome.passed ? "complete" : "gentle", bn.soundOn);
  }, [outcome, bn.soundOn]);

  return (
    <div className="mx-auto grid w-full max-w-xl gap-5 text-center" lang={lang}>
      <section className="card grid animate-pop place-items-center gap-3 px-5 py-8" aria-labelledby="done">
        <span className="text-6xl" aria-hidden="true">{icon}</span>
        <h1 id="done" className="text-3xl sm:text-4xl">{m.title}</h1>
        <p className="-mt-1 max-w-sm font-bold text-muted">{m.sub}</p>
        <Stars count={rating(outcome.pct)} size="text-5xl" animate />
        <p className="text-lg font-bold">{t.correct(outcome.correct, outcome.total)}</p>
        <div className="mt-1 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sun/25 px-3 py-4">
            <p className="font-display text-3xl font-semibold">+{num(outcome.starsEarned, lang)} ⭐</p>
            <p className="text-sm font-extrabold text-muted">{t.newStars}</p>
          </div>
          <div className="rounded-2xl bg-math/15 px-3 py-4">
            <p className="font-display text-3xl font-semibold">{num(outcome.progress.stars + bn.stars, lang)} ⭐</p>
            <p className="text-sm font-extrabold text-muted">{t.total}</p>
          </div>
        </div>
        {outcome.alreadyRewarded > 0 && <p className="text-sm font-bold text-muted">{t.already(outcome.alreadyRewarded)}</p>}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className="btn-primary" onClick={onRetry}>{t.retry}</button>
        <Link to={quizBackHref(quiz.id)} className="btn-secondary">{t.back}</Link>
        <Link to={HUB} className="btn-ghost sm:col-span-2">{t.hub}</Link>
      </div>
    </div>
  );
}

function QuizBody({ id, lang }: { id: string; lang: Lang }) {
  const { go } = useNav();
  const { progress: bn } = useBnProgress();
  const [seed, setSeed] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<HubQuizOutcome | null>(null);
  const finished = useRef(false);
  useEffect(() => { setSeed(newSeed()); setOutcome(null); finished.current = false; }, [id]);
  const quiz = useMemo(() => (seed ? buildHubQuiz(id, seed) : null), [id, seed]);
  const icon = quizSection(id)?.icon ?? (id.startsWith("poem-") ? "🎵" : id.startsWith("story-") ? "📚" : "🎯");
  const activity = useMemo(() => (quiz ? toActivity(quiz, icon) : null), [quiz, icon]);

  if (outcome && quiz) {
    return <Result key={seed ?? ""} quiz={quiz} outcome={outcome} icon={icon}
      onRetry={() => { finished.current = false; setOutcome(null); setSeed(newSeed()); window.scrollTo({ top: 0 }); }} />;
  }
  if (!quiz || !activity) return <Spinner label={MSG[lang].making} />;

  function finish(responses: Record<string, Response>) {
    if (finished.current || !quiz) return; // never record one attempt twice
    finished.current = true;
    const result = recordHubQuiz(getHubProgress(), quiz.id, quiz.questions, responses);
    updateHubProgress(() => result.progress);
    setOutcome(result);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="grid gap-3" lang={quiz.lang}>
      <h1 className="sr-only">{quiz.title}</h1>
      <QuizRunner key={seed} activity={activity} lang={quiz.lang} soundOn={bn.soundOn} submitting={false}
        onFinish={(responses) => finish(responses)} onExit={() => go(quizBackHref(id))} />
    </div>
  );
}

export function HubQuizScreen() {
  const { params } = useNav();
  const id = params.id ?? "";
  const valid = buildHubQuiz(id, 0);
  const lang: Lang = valid?.lang ?? "bn";
  return (
    <HubShell lang={lang}>
      {valid ? <QuizBody id={id} lang={lang} /> : <HubNotFound lang={lang} />}
    </HubShell>
  );
}
