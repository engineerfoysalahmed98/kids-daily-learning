"use client";
import { useEffect, useMemo, useRef } from "react";
import type { CompletionResult } from "@/core/types";
import { TRACK_META } from "@/core/content/meta";
import { summarize } from "@/core/engine";
import { useApp } from "@/state/AppProvider";
import { activityHref, useChildData } from "@/state/useChild";
import { Link, useNav } from "@/nav/nav";
import { ChildShell, useChildPrefs } from "@/ui/shells/ChildShell";
import { CountUp, Spinner, Stars } from "@/ui/primitives";
import { confetti, playSfx } from "@/ui/effects";
import { NotFound } from "./shared";

function headline(r: CompletionResult): { title: string; sub?: string } {
  const pct = r.score?.pct ?? null;
  if (r.completion.repeat) return { title: "Great practice! 💪" };
  if (pct === null) return { title: "Awesome work! 🌟" };
  if (pct === 100) return { title: "Perfect score! 🎉" };
  if (pct >= 60) return { title: "Great job! 🎉" };
  return { title: "You finished! 💪", sub: "Every try makes your brain stronger. Want to try it again later?" };
}

function CompleteBody() {
  const { params } = useNav();
  const { results } = useApp();
  const { progress, plan, today } = useChildData();
  const { soundOn } = useChildPrefs();
  const id = params.id;

  // Prefer the fresh result; after a reload fall back to the saved completion.
  const result: CompletionResult | null = useMemo(() => {
    const fresh = id ? results.get(id) : undefined;
    if (fresh) return fresh;
    const c = progress?.completions.filter((x) => x.activityId === id).at(-1);
    if (!c || !progress) return null;
    return { completion: c, score: c.total ? { correct: c.correct, total: c.total, pct: c.scorePct ?? 0, results: [] } : null, xpAwarded: c.xp, stars: c.stars, newBadges: [], streak: progress.streak, streakChanged: "same", goalReachedNow: false, summary: summarize(progress, today) };
  }, [id, results, progress, today]);

  const celebrated = useRef(false);
  useEffect(() => {
    if (!result || celebrated.current) return;
    celebrated.current = true;
    confetti();
    playSfx(result.newBadges.length ? "badge" : "complete", soundOn);
  }, [result, soundOn]);

  if (!progress) return <Spinner />;
  if (!result) return <NotFound />;
  const c = result.completion;
  const doneToday = new Set(progress.completions.filter((x) => x.day === today).map((x) => x.activityId));
  const next = plan.find((a) => !doneToday.has(a.id));
  const s = result.summary;
  const streakText =
    result.streakChanged === "extended" ? `🔥 ${result.streak.current}-day streak! Keep going! 🚀`
    : result.streakChanged === "started" ? "🔥 You started a learning streak!"
    : result.streakChanged === "restarted" ? "🌱 Welcome back! A new streak starts today."
    : null;

  return (
    <div className="mx-auto grid max-w-xl gap-5 text-center">
      <section className="card grid animate-pop place-items-center gap-3 px-5 py-8" aria-labelledby="done-title">
        <span className="text-6xl" aria-hidden="true">{c.icon}</span>
        <p className="label">{TRACK_META[c.track].label} · {c.title}</p>
        <h1 id="done-title" className="text-3xl sm:text-4xl">{headline(result).title}</h1>
        {headline(result).sub && <p className="-mt-1 max-w-sm font-bold text-muted">{headline(result).sub}</p>}
        <Stars count={result.stars} size="text-5xl" animate />
        {result.score && <p className="text-lg font-bold">You got <span className="tnum">{result.score.correct}</span> of <span className="tnum">{result.score.total}</span> right</p>}
        <div className="mt-2 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sun/25 px-3 py-4">
            <p className="font-display text-3xl font-semibold">+<CountUp to={result.xpAwarded} /></p>
            <p className="text-sm font-extrabold text-muted">XP earned ⚡</p>
          </div>
          <div className="rounded-2xl bg-math/15 px-3 py-4">
            <p className="font-display text-3xl font-semibold"><CountUp from={Math.max(0, s.xp - result.xpAwarded)} to={s.xp} /></p>
            <p className="text-sm font-extrabold text-muted">Total XP</p>
          </div>
        </div>
        {streakText && <p className="w-full rounded-2xl bg-flame/15 px-4 py-3 font-bold">{streakText}</p>}
        {result.goalReachedNow && <p className="w-full rounded-2xl bg-science/15 px-4 py-3 font-bold">🎯 You reached today&apos;s goal of {s.goal} activities!</p>}
        {c.repeat && <p className="text-sm font-bold text-muted">You already did this one today, so it gives practice XP. New activities give full XP!</p>}
      </section>

      {result.newBadges.length > 0 && (
        <section className="card grid gap-3 border-sun bg-sun/10 p-5" aria-labelledby="new-badges">
          <h2 id="new-badges" className="text-2xl">New badge{result.newBadges.length > 1 ? "s" : ""} unlocked! 🏆</h2>
          <ul className="grid gap-3">
            {result.newBadges.map((b, i) => (
              <li key={b.id} className="flex animate-pop items-center gap-4 rounded-2xl bg-surface p-3 text-left" style={{ animationDelay: `${0.5 + i * 0.2}s` }}>
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-sun/40 text-4xl" aria-hidden="true">{b.icon}</span>
                <span><span className="block font-display text-xl font-semibold">{b.name}</span><span className="block text-muted">{b.description}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {next ? <Link to={activityHref(next)} className="btn-primary sm:col-span-2">Next: {next.icon} {next.title}</Link>
          : <p className="rounded-2xl bg-science/15 px-4 py-3 font-bold sm:col-span-2">🌈 You finished today&apos;s whole adventure!</p>}
        <Link to="/home" className="btn-secondary">🏠 Home</Link>
        <Link to="/rewards" className="btn-secondary">🏆 My rewards</Link>
      </div>
    </div>
  );
}

export function CompleteScreen() { return <ChildShell><CompleteBody /></ChildShell>; }
