"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Response } from "@/core/types";
import {
  buildBnQuiz, instructionFor, LEVEL_NAME, parseQuizId, ratingStars, recordQuiz, resultMessage, toBn, TOPIC_META, type QuizOutcome,
} from "@/core/bangla";
import { Link, useNav } from "@/nav/nav";
import { getBnProgress, updateBnProgress, useBnProgress } from "@/state/bnGuestStore";
import { QuizRunner } from "@/ui/quiz/QuizRunner";
import { Spinner, Stars } from "@/ui/primitives";
import { confetti, playSfx } from "@/ui/effects";
import { BadgeList, BanglaShell, BnNotFound, HUB } from "./shared";
import { topicHref } from "./HomeScreen";

function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function Result({ quizKey, outcome, onRetry }: { quizKey: string; outcome: QuizOutcome; onRetry: () => void }) {
  const spec = parseQuizId(quizKey)!;
  const msg = resultMessage(outcome.pct);
  const { progress } = useBnProgress();
  const nextLevel = !spec.group && spec.level < 3 && outcome.passed ? spec.level + 1 : null;
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    if (outcome.passed) confetti();
    playSfx(outcome.newBadges.length ? "badge" : "complete", progress.soundOn);
  }, [outcome, progress.soundOn]);

  return (
    <div className="mx-auto grid w-full max-w-xl gap-5 text-center">
      <section className="card grid animate-pop place-items-center gap-3 px-5 py-8" aria-labelledby="done">
        <span className="text-6xl" aria-hidden="true">{TOPIC_META[spec.topic].icon}</span>
        <h1 id="done" className="text-3xl sm:text-4xl">{msg.title}</h1>
        <p className="-mt-1 max-w-sm font-bold text-muted">{msg.sub}</p>
        <Stars count={ratingStars(outcome.pct)} size="text-5xl" animate />
        <p className="text-lg font-bold">{toBn(outcome.total)}টির মধ্যে <span className="tnum">{toBn(outcome.correct)}</span>টি সঠিক</p>
        <div className="mt-1 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sun/25 px-3 py-4">
            <p className="font-display text-3xl font-semibold">+{toBn(outcome.starsEarned)} ⭐</p>
            <p className="text-sm font-extrabold text-muted">নতুন তারা</p>
          </div>
          <div className="rounded-2xl bg-math/15 px-3 py-4">
            <p className="font-display text-3xl font-semibold">{toBn(outcome.progress.stars)} ⭐</p>
            <p className="text-sm font-extrabold text-muted">মোট তারা</p>
          </div>
        </div>
        {outcome.alreadyRewarded > 0 && (
          <p className="text-sm font-bold text-muted">{toBn(outcome.alreadyRewarded)}টি প্রশ্নের তারা তুমি আগেই পেয়েছিলে। নতুন প্রশ্নে আরও তারা পাবে!</p>
        )}
      </section>

      <BadgeList badges={outcome.newBadges} />

      <div className="grid gap-3 sm:grid-cols-2">
        {nextLevel ? (
          <Link to={`${HUB}/quiz/${spec.topic}-${nextLevel}`} className="btn-primary sm:col-span-2">পরের স্তর: {LEVEL_NAME[nextLevel as 2 | 3]} →</Link>
        ) : null}
        <button type="button" className={nextLevel ? "btn-secondary" : "btn-primary"} onClick={onRetry}>🔁 আবার খেলো</button>
        <Link to={spec.group ? `${HUB}/numbers/${spec.group}` : topicHref(spec.topic)} className="btn-secondary">📖 পাঠে ফিরে যাও</Link>
        <Link to={HUB} className="btn-ghost sm:col-span-2">🏠 সব খেলা</Link>
      </div>
    </div>
  );
}

function QuizBody() {
  const { params, go } = useNav();
  const id = params.id ?? "";
  const spec = parseQuizId(id);
  const { progress } = useBnProgress();
  // Seeds are random, so they are created only in the browser (no hydration mismatch).
  const [seed, setSeed] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const finished = useRef(false);
  useEffect(() => { setSeed(newSeed()); setOutcome(null); finished.current = false; }, [id]);
  const activity = useMemo(() => (seed ? buildBnQuiz(id, seed) : null), [id, seed]);

  if (!spec) return <BnNotFound />;
  if (outcome) {
    return <Result key={seed ?? ""} quizKey={id} outcome={outcome} onRetry={() => { finished.current = false; setOutcome(null); setSeed(newSeed()); window.scrollTo({ top: 0 }); }} />;
  }
  if (!activity) return <Spinner label="খেলা তৈরি হচ্ছে" />;

  function finish(responses: Record<string, Response>) {
    if (finished.current || !activity) return; // never record the same attempt twice
    finished.current = true;
    const result = recordQuiz(getBnProgress(), id, activity.questions ?? [], responses, new Date().toISOString());
    updateBnProgress(() => result.progress);
    setOutcome(result);
    window.scrollTo({ top: 0 });
  }

  const back = spec.group ? `${HUB}/numbers/${spec.group}` : topicHref(spec.topic);
  return (
    <div className="grid gap-3">
      <p className="mx-auto w-full max-w-2xl rounded-2xl bg-math/10 px-4 py-2 text-sm font-bold">{instructionFor(progress.ageGroup)}</p>
      <QuizRunner key={seed} activity={activity} lang="bn" soundOn={progress.soundOn} submitting={false}
        onFinish={(responses) => finish(responses)} onExit={() => go(back)} />
    </div>
  );
}

export function BnQuizScreen() {
  return <BanglaShell><QuizBody /></BanglaShell>;
}
