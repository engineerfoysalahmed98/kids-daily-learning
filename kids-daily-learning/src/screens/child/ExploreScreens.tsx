"use client";
import { useMemo } from "react";
import { baseLevel, GAMES, ruleProgress, computeStats, storiesFor, STREAK_MILESTONES, visibleStreak, streakMessage } from "@/core/engine";
import { useChildData } from "@/state/useChild";
import { Link } from "@/nav/nav";
import { ChildShell } from "@/ui/shells/ChildShell";
import { Blob, ProgressBar, Skeleton, EmptyState, Stars } from "@/ui/primitives";
import { BORDER, TINT, toneOf } from "@/ui/colors";

// ---------------------------------------------------------------- Games

function GamesBody() {
  const { progress, content } = useChildData();
  const seed = useMemo(() => Math.floor(Math.random() * 1e8), []);
  if (!progress || !content) return <Skeleton className="h-96" />;
  const level = baseLevel(progress.child.age, content.ageGroups);
  const allowed = progress.child.settings.allowedTracks;
  const gameTrack = { memory: "brain", pattern: "brain", quickmath: "math", wordmatch: "english" } as const;
  const games = GAMES.filter((g) => allowed.includes(gameTrack[g.id]));
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">Games 🎮</h1>
        <p className="font-bold text-muted">Learning games — no timers, no rush.</p>
      </div>
      {games.length === 0 ? <EmptyState title="Games are switched off" /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {games.map((g) => {
            const id = `g.${g.id}.${level}.${seed}`;
            const route = g.id === "memory" ? "memory" : "quiz";
            const tone = toneOf(g.color);
            return (
              <Link key={g.id} to={`/${route}/${encodeURIComponent(id)}`} className={`card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 ${BORDER[tone]}`}>
                <span className={`grid h-20 w-20 shrink-0 place-items-center rounded-3xl text-5xl transition group-hover:rotate-6 ${TINT[tone]}`} aria-hidden="true">{g.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-2xl font-semibold">{g.title}</span>
                  <span className="block font-bold text-muted">{g.description}</span>
                </span>
                <span className="btn-primary btn-sm" aria-hidden="true">Play</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
export function GamesScreen() { return <ChildShell><GamesBody /></ChildShell>; }

// ---------------------------------------------------------------- Stories

function StoriesBody() {
  const { progress, content } = useChildData();
  if (!progress || !content) return <Skeleton className="h-96" />;
  if (!progress.child.settings.allowedTracks.includes("story")) return <EmptyState emoji="📖" title="Stories are switched off" body="Ask a grown-up to turn them on." />;
  const forMe = storiesFor(content, progress.child.age);
  const others = content.stories.filter((s) => !forMe.includes(s));
  const read = new Set(progress.completions.filter((c) => c.track === "story").map((c) => c.title));
  const Card = ({ s }: { s: (typeof content.stories)[number] }) => (
    <Link to={`/read/${encodeURIComponent(`s.${s.id}`)}`} className="card group overflow-hidden transition hover:-translate-y-0.5">
      <div className={`grid aspect-[16/9] max-w-full place-items-center ${TINT[toneOf(s.sceneColor)]}`} aria-hidden="true">
        <span className="text-5xl tracking-[0.15em] transition group-hover:scale-105">{s.scene}</span>
      </div>
      <div className="grid gap-1 p-4">
        <h3 className="text-xl leading-tight">{s.title}</h3>
        <p className="text-sm font-bold text-muted">Ages {s.minAge}–{s.maxAge} · {s.questions.length} questions {read.has(s.title) ? "· Read ✓" : ""}</p>
      </div>
    </Link>
  );
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">Story Time 📖</h1>
        <p className="font-bold text-muted">Read by yourself or tap 🔊 to listen.</p>
      </div>
      <section className="grid gap-3">
        <h2 className="text-xl">Picked for you</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{forMe.map((s) => <Card key={s.id} s={s} />)}</div>
      </section>
      {others.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-xl">More stories</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{others.map((s) => <Card key={s.id} s={s} />)}</div>
        </section>
      )}
    </div>
  );
}
export function StoriesScreen() { return <ChildShell><StoriesBody /></ChildShell>; }

// ---------------------------------------------------------------- Rewards

function RewardsBody() {
  const { progress, content, summary, today } = useChildData();
  if (!progress || !content || !summary) return <Skeleton className="h-96" />;
  const streak = visibleStreak(progress.streak, today);
  const earned = new Map(progress.badges.map((b) => [b.badgeId, b]));
  const recent = content.badges.filter((b) => earned.has(b.id)).sort((a, b) => (earned.get(a.id)!.unlockedAt < earned.get(b.id)!.unlockedAt ? 1 : -1)).slice(0, 4);
  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak) ?? null;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">My Rewards 🏆</h1>
        <p className="font-bold text-muted">Every star shows how hard you worked.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card grid place-items-center gap-1 bg-sun/15 p-6 text-center">
          <span className="text-5xl" aria-hidden="true">⭐</span>
          <p className="font-display text-4xl font-semibold tnum">{summary.stars}</p>
          <p className="font-bold text-muted">Stars collected</p>
        </div>
        <div className="card grid place-items-center gap-1 bg-math/10 p-6 text-center">
          <span className="text-5xl" aria-hidden="true">⚡</span>
          <p className="font-display text-4xl font-semibold tnum">{summary.xp}</p>
          <p className="font-bold text-muted">XP earned</p>
        </div>
        <div className="card grid place-items-center gap-1 bg-flame/10 p-6 text-center">
          <span className="text-5xl" aria-hidden="true">🔥</span>
          <p className="font-display text-4xl font-semibold tnum">{streak}</p>
          <p className="font-bold text-muted">Day streak · best {progress.streak.longest}</p>
        </div>
      </section>

      <section className="card grid gap-4 p-5" aria-labelledby="streak-title">
        <h2 id="streak-title" className="text-2xl">Streak path</h2>
        <p className="font-bold">{streakMessage(progress.streak, today)}</p>
        <ol className="flex flex-wrap gap-2" aria-label="Streak milestones">
          {STREAK_MILESTONES.map((m) => {
            const reached = progress.streak.longest >= m;
            return (
              <li key={m} className={`flex min-h-[44px] items-center gap-1.5 rounded-full px-4 font-extrabold ${reached ? "bg-flame/20" : "bg-sunken text-muted"}`}>
                <span aria-hidden="true">{reached ? "🔥" : "○"}</span>{m} Day{m > 1 ? "s" : ""}
                <span className="sr-only">{reached ? "reached" : "not yet"}</span>
              </li>
            );
          })}
        </ol>
        {nextMilestone && <p className="text-sm font-bold text-muted">Next milestone: {nextMilestone} days. Missing a day is okay — you can always start again. 🌱</p>}
      </section>

      <section className="grid gap-3" aria-labelledby="recent-badges">
        <div className="flex items-end justify-between">
          <h2 id="recent-badges" className="text-2xl">Latest badges</h2>
          <Link to="/badges" className="btn-secondary btn-sm">See all {content.badges.length} →</Link>
        </div>
        {recent.length === 0 ? <EmptyState emoji="🏅" title="Your first badge is waiting!" body="Finish any activity to unlock “First Activity”." action={<Link to="/home" className="btn-primary">Start learning</Link>} /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recent.map((b) => (
              <div key={b.id} className="card grid place-items-center gap-2 p-4 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-sun/35 text-4xl" aria-hidden="true">{b.icon}</span>
                <p className="font-display text-lg font-semibold leading-tight">{b.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3" aria-labelledby="recent-work">
        <h2 id="recent-work" className="text-2xl">Recent stars</h2>
        {progress.completions.length === 0 ? <p className="text-muted">Nothing yet — your stars will show up here.</p> : (
          <ul className="card divide-y-2 divide-line">
            {progress.completions.slice(-6).reverse().map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Blob tone={toneOf(c.track)} emoji={c.icon} size="sm" />
                <span className="min-w-0 flex-1 truncate font-bold">{c.title}</span>
                <Stars count={c.stars} size="text-base" />
                <span className="chip tnum bg-sun/25">+{c.xp}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
export function RewardsScreen() { return <ChildShell><RewardsBody /></ChildShell>; }

// ---------------------------------------------------------------- Badges

function BadgesBody() {
  const { progress, content } = useChildData();
  if (!progress || !content) return <Skeleton className="h-96" />;
  const stats = computeStats(progress);
  const earned = new Map(progress.badges.map((b) => [b.badgeId, b]));
  const sorted = [...content.badges].sort((a, b) => Number(earned.has(b.id)) - Number(earned.has(a.id)));
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">Badges 🏅</h1>
        <p className="font-bold text-muted">{earned.size} of {content.badges.length} unlocked</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((b) => {
          const got = earned.get(b.id);
          const prog = ruleProgress(b.rule, stats);
          return (
            <li key={b.id} className={`card grid place-items-center content-start gap-2 p-4 text-center ${got ? "border-sun/70" : ""}`}>
              <span className={`grid h-20 w-20 place-items-center rounded-full text-5xl ${got ? "bg-sun/35" : "bg-sunken grayscale"}`} aria-hidden="true">
                {got ? b.icon : <span className="opacity-40">{b.icon}</span>}
              </span>
              <p className="font-display text-lg font-semibold leading-tight">{b.name}</p>
              <p className="text-sm font-bold text-muted">{b.description}</p>
              {got ? (
                <p className="chip bg-good/15 text-good">✓ Unlocked {new Date(got.unlockedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
              ) : (
                <div className="grid w-full gap-1">
                  <ProgressBar value={prog.value} max={prog.target} label={`${b.name} progress`} size="sm" />
                  <p className="text-xs font-extrabold text-muted tnum">🔒 {prog.value}/{prog.target}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
export function BadgesScreen() { return <ChildShell><BadgesBody /></ChildShell>; }
