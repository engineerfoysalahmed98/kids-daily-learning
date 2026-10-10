"use client";
import { activityHref, useChildData } from "@/state/useChild";
import { streakMessage } from "@/core/engine";
import { Link } from "@/nav/nav";
import { ChildShell, useChildPrefs } from "@/ui/shells/ChildShell";
import { Ring, Skeleton, StatChip, EmptyState } from "@/ui/primitives";
import { BuddyBot } from "@/ui/brand";
import { ActivityCard } from "./shared";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function HomeBody() {
  const { progress, plan, summary, today } = useChildData();
  const { aiEnabled } = useChildPrefs();
  if (!progress || !summary) return <div className="grid gap-4"><Skeleton className="h-32" /><Skeleton className="h-48" /></div>;
  const child = progress.child;
  const doneToday = new Map(progress.completions.filter((c) => c.day === today).map((c) => [c.activityId, c]));
  const doneCount = plan.filter((a) => doneToday.has(a.id)).length;
  const next = plan.find((a) => !doneToday.has(a.id));
  const goalMet = summary.todayDone >= summary.goal;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="font-bold text-muted">{greeting()}!</p>
          <h1 className="text-3xl sm:text-4xl">Hi, {child.name}! <span className="inline-block origin-bottom-right animate-wiggle" aria-hidden="true">👋</span></h1>
          <p className="mt-1 font-bold text-muted">{streakMessage(progress.streak, today)}</p>
        </div>
        <div className="flex items-center gap-3 rounded-card bg-surface p-3 pr-5 sm:border-2 sm:border-line">
          <Ring value={summary.todayDone} max={summary.goal} label={`Daily goal: ${summary.todayDone} of ${summary.goal} activities`} tone={goalMet ? "science" : "sun"}>
            <span className="font-display text-lg font-semibold tnum">{Math.min(summary.todayDone, summary.goal)}/{summary.goal}</span>
          </Ring>
          <div className="leading-tight">
            <p className="label">Today&apos;s goal</p>
            <p className="font-display text-lg font-semibold">{goalMet ? "Goal complete! 🎯" : `${summary.goal - summary.todayDone} more to go`}</p>
          </div>
        </div>
      </section>

      <section aria-label="Your stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon="⚡" value={summary.xp} label="XP" tone="sun" />
        <StatChip icon="🔥" value={`${summary.streak.current} day${summary.streak.current === 1 ? "" : "s"}`} label="Streak" tone="creativity" />
        <StatChip icon="🏆" value={summary.badges} label="Badges" tone="story" />
        <StatChip icon="📚" value={summary.activitiesCompleted} label="Activities" tone="math" />
      </section>

      <section aria-labelledby="adventure" className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="adventure" className="text-2xl sm:text-3xl">Today&apos;s Adventure</h2>
            <p className="font-bold text-muted">{doneCount === plan.length && plan.length ? "You finished them all! Amazing! 🌈" : `${doneCount} of ${plan.length} done`}</p>
          </div>
          {next && <Link to={activityHref(next)} className="btn-primary">Continue: {next.icon} {next.title}</Link>}
        </div>
        {plan.length === 0 ? (
          <EmptyState emoji="🗺️" title="No activities today" body="A grown-up has switched off all the subjects. Ask them to turn some back on in Parent Settings." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plan.map((a, i) => <ActivityCard key={a.id} activity={a} done={doneToday.get(a.id)} index={i} />)}
          </div>
        )}
      </section>

      {aiEnabled && (
        <Link to="/buddy" className="card flex items-center gap-4 border-gk/40 p-4 hover:bg-gk/5">
          <BuddyBot size={60} mood="wave" className="shrink-0 animate-floaty" />
          <span>
            <span className="block font-display text-xl font-semibold">Ask Buddy 🤖</span>
            <span className="block text-muted">Stuck or curious? Buddy helps you learn step by step.</span>
          </span>
          <span className="ml-auto text-2xl" aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}

export function HomeScreen() {
  return <ChildShell><HomeBody /></ChildShell>;
}
