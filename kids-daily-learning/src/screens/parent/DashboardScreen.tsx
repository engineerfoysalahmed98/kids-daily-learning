"use client";
import { useState } from "react";
import type { ChildProgress } from "@/core/types";
import { SCORED_TRACKS } from "@/core/types";
import { TRACK_META } from "@/core/content/meta";
import { dayKey, lastNDays, mastery, recommendations, summarize } from "@/core/engine";
import { useApp, useLoad } from "@/state/AppProvider";
import { Link, useNav } from "@/nav/nav";
import { ParentShell } from "@/ui/shells/ParentShell";
import { EmptyState, ErrorState, ProgressBar, Ring, Skeleton } from "@/ui/primitives";
import { ColumnChart } from "@/ui/charts";
import { toneOf } from "@/ui/colors";
import { ChildSwitcher, fmtDay, fmtMinutes, useFamily, useSelectedChild } from "./common";

export function RecentTable({ p, limit = 8 }: { p: ChildProgress; limit?: number }) {
  const rows = [...p.completions].reverse().slice(0, limit);
  if (!rows.length) return <p className="px-5 pb-5 text-muted">No activities yet. They&apos;ll show up here as soon as {p.child.name} finishes one.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b-2 border-line text-xs font-extrabold uppercase tracking-wider text-muted">
            <th scope="col" className="px-5 py-2">Date</th>
            <th scope="col" className="px-2 py-2">Activity</th>
            <th scope="col" className="px-2 py-2">Subject</th>
            <th scope="col" className="px-2 py-2 text-right">Score</th>
            <th scope="col" className="px-5 py-2 text-right">Time spent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0">
              <td className="whitespace-nowrap px-5 py-3 text-sm font-bold text-muted">{fmtDay(c.day, { month: "short", day: "numeric" })}</td>
              <td className="px-2 py-3 font-bold"><span aria-hidden="true">{c.icon} </span>{c.title}{c.repeat && <span className="ml-2 chip text-xs">practice</span>}</td>
              <td className="px-2 py-3 text-sm font-bold">{TRACK_META[c.track].progressLabel}</td>
              <td className="tnum px-2 py-3 text-right font-bold">{c.scorePct === null ? <span className="text-muted">Done ✓</span> : <span className={c.scorePct >= 80 ? "text-good" : c.scorePct < 50 ? "text-oops" : ""}>{c.scorePct}%</span>}</td>
              <td className="tnum whitespace-nowrap px-5 py-3 text-right text-sm font-bold text-muted">{fmtMinutes(c.seconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Body() {
  const fam = useFamily();
  const { service, refreshSession } = useApp();
  const nav = useNav();
  const { child, select } = useSelectedChild(fam.data?.children);
  const notes = useLoad((s) => s.listNotifications());
  const [marking, setMarking] = useState(false);
  const today = dayKey();

  if (fam.error) return <ErrorState error={fam.error} onRetry={fam.reload} />;
  if (!fam.data) return <div className="grid gap-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;
  if (!fam.data.children.length || !child) {
    return <EmptyState emoji="👧" title="Add your first child" body="Create a profile to start their daily learning adventure." action={<Link to="/parent/children" className="btn-primary">Add a child</Link>} />;
  }
  const p = fam.data.progress[child.id];
  const s = summarize(p, today);
  const m = mastery(p.completions);
  const week = lastNDays(p, today, 7);
  const recs = recommendations(p, today);
  const usedMin = Math.round((p.usage[today] ?? 0) / 60);
  const tracks = SCORED_TRACKS.filter((t) => child.settings.allowedTracks.includes(t));
  const myNotes = (notes.data ?? []).slice(0, 6);
  const unread = (notes.data ?? []).filter((n) => !n.read).length;

  return (
    <div className="grid gap-5">
      <ChildSwitcher kids={fam.data.children} selected={child.id} onSelect={select} />

      {/* Child overview */}
      <section className="card grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center" aria-labelledby="overview">
        <div className="flex items-center gap-4">
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-sun/30 text-5xl" aria-hidden="true">{child.avatar}</span>
          <div>
            <h2 id="overview" className="text-2xl">{child.name}</h2>
            <p className="font-bold text-muted">Age {child.age}</p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-center md:border-l-2 md:border-line md:pl-5">
          <div><dt className="label">Streak</dt><dd className="font-display text-2xl font-semibold tnum">🔥 {s.streak.current}</dd></div>
          <div><dt className="label">Total XP</dt><dd className="font-display text-2xl font-semibold tnum">{s.xp}</dd></div>
          <div><dt className="label">Activities</dt><dd className="font-display text-2xl font-semibold tnum">{s.activitiesCompleted}</dd></div>
        </dl>
        <div className="flex items-center gap-4">
          <Ring value={s.todayDone} max={s.goal} size={70} tone={s.todayDone >= s.goal ? "science" : "sun"} label={`Today ${s.todayDone} of ${s.goal} activities`}>
            <span className="text-sm font-extrabold tnum">{Math.min(s.todayDone, s.goal)}/{s.goal}</span>
          </Ring>
          <div className="text-sm font-bold leading-snug">
            <p>Today&apos;s goal</p>
            <p className="text-muted tnum">{usedMin} / {child.settings.screenTimeMinutes || "∞"} min used</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Progress */}
        <section className="card grid content-start gap-4 p-5" aria-labelledby="prog">
          <div className="flex items-center justify-between"><h2 id="prog" className="text-xl">Progress</h2><Link to="/parent/progress" className="text-sm font-bold text-muted underline underline-offset-4">Details</Link></div>
          <ul className="grid gap-3">
            {tracks.map((t) => (
              <li key={t} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3">
                <span className="font-bold"><span aria-hidden="true">{TRACK_META[t].icon} </span>{TRACK_META[t].progressLabel}</span>
                <ProgressBar value={m[t] ?? 0} tone={toneOf(TRACK_META[t].color)} label={`${TRACK_META[t].progressLabel} mastery`} />
                <span className="tnum text-right font-extrabold">{m[t] === null ? "—" : `${m[t]}%`}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs font-bold text-muted">Mastery = recent quiz scores, newest weighted most.</p>
        </section>

        <section className="card grid content-start gap-3 p-5" aria-labelledby="week">
          <h2 id="week" className="text-xl">Activities, last 7 days</h2>
          <ColumnChart title="Activities per day" unit="activities" tone="math"
            data={week.map((d) => ({ key: d.day, label: fmtDay(d.day).slice(0, 2), value: d.activities, detail: `${fmtDay(d.day, { weekday: "long" })} · ${d.minutes} min · ${d.xp} XP` }))} />
          <p className="text-sm font-bold text-muted">Learned on {week.filter((d) => d.activities).length} of 7 days · {week.reduce((a, d) => a + d.minutes, 0)} minutes total</p>
        </section>
      </div>

      {/* Recommendations */}
      <section aria-labelledby="recs" className="grid gap-3">
        <h2 id="recs" className="text-xl">Suggestions for {child.name}</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {recs.map((r) => (
            <li key={r.title} className="card flex gap-3 p-4"><span className="text-3xl" aria-hidden="true">{r.icon}</span><span><span className="block font-bold">{r.title}</span><span className="block text-sm text-muted">{r.body}</span></span></li>
          ))}
        </ul>
      </section>

      {/* Recent activity */}
      <section className="card grid gap-3 pt-5" aria-labelledby="recent">
        <h2 id="recent" className="px-5 text-xl">Recent activity</h2>
        <RecentTable p={p} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Notifications */}
        <section className="card grid content-start gap-3 p-5" aria-labelledby="notes">
          <div className="flex items-center justify-between gap-2">
            <h2 id="notes" className="text-xl">Notifications {unread > 0 && <span className="chip ml-1 bg-english/20 text-sm">{unread} new</span>}</h2>
            {unread > 0 && <button className="btn-ghost btn-sm" disabled={marking} onClick={async () => { setMarking(true); await service.markNotificationsRead(); setMarking(false); }}>Mark all read</button>}
          </div>
          {notes.data === undefined ? <Skeleton className="h-24" /> : myNotes.length === 0 ? <p className="text-muted">No notifications yet. Choose which ones you get in Settings.</p> : (
            <ul className="grid gap-2">
              {myNotes.map((n) => (
                <li key={n.id} className={`flex gap-3 rounded-2xl p-3 ${n.read ? "bg-sunken/60" : "bg-math/10"}`}>
                  <span className="text-xl" aria-hidden="true">{n.kind === "badge" ? "🏆" : n.kind === "goal" ? "🎯" : n.kind === "safety" ? "💛" : "✅"}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{n.text}</span><span className="block text-xs font-bold text-muted">{new Date(n.createdAt).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Controls summary */}
        <section className="card grid content-start gap-3 p-5" aria-labelledby="controls">
          <div className="flex items-center justify-between"><h2 id="controls" className="text-xl">Parent controls</h2><Link to="/parent/settings" className="btn-secondary btn-sm">Edit</Link></div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Daily goal", `${child.settings.dailyGoal} activities`],
              ["Screen time", child.settings.screenTimeMinutes ? `${child.settings.screenTimeMinutes} min/day` : "No limit"],
              ["Buddy AI", child.settings.aiEnabled ? "On" : "Off"],
              ["Sound", child.settings.soundOn ? "On" : "Off"],
              ["Subjects", `${child.settings.allowedTracks.length} of 8 on`],
              ["Large text", child.settings.largeText ? "On" : "Off"],
            ].map(([k, v]) => <div key={k} className="rounded-2xl bg-sunken px-3 py-2"><dt className="font-bold text-muted">{k}</dt><dd className="font-extrabold">{v}</dd></div>)}
          </dl>
          <button className="btn-primary" onClick={async () => { await service.enterChildMode(child.id); await refreshSession(); nav.go("/home"); }}>▶ Start learning as {child.name}</button>
        </section>
      </div>
    </div>
  );
}

export function ParentDashboardScreen() {
  return <ParentShell title="Dashboard"><Body /></ParentShell>;
}
