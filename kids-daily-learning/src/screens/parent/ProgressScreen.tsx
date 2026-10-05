"use client";
import { useState } from "react";
import type { Track } from "@/core/types";
import { SCORED_TRACKS } from "@/core/types";
import { TRACK_META } from "@/core/content/meta";
import { addDays, dayKey, decideLevel, lastNDays, mastery, scoreTrend } from "@/core/engine";
import { ParentShell } from "@/ui/shells/ParentShell";
import { EmptyState, ErrorState, Skeleton } from "@/ui/primitives";
import { ColumnChart, TrendChart } from "@/ui/charts";
import { TINT, toneOf } from "@/ui/colors";
import { Link } from "@/nav/nav";
import { ChildSwitcher, fmtDay, useFamily, useSelectedChild } from "./common";
import { RecentTable } from "./DashboardScreen";

function Body() {
  const fam = useFamily();
  const { child, select } = useSelectedChild(fam.data?.children);
  const [track, setTrack] = useState<Track>("math");
  const today = dayKey();
  if (fam.error) return <ErrorState error={fam.error} onRetry={fam.reload} />;
  if (!fam.data) return <Skeleton className="h-96" />;
  if (!child) return <EmptyState title="No children yet" action={<Link to="/parent/children" className="btn-primary">Add a child</Link>} />;
  const p = fam.data.progress[child.id];
  const m = mastery(p.completions);
  const tracks = SCORED_TRACKS.filter((t) => child.settings.allowedTracks.includes(t));
  const active = tracks.includes(track) ? track : tracks[0];
  const days14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const trend = active ? scoreTrend(p, active, today, 14) : [];
  const d14 = lastNDays(p, today, 14);
  const earned = fam.data.content.badges.filter((b) => p.badges.some((x) => x.badgeId === b.id));

  return (
    <div className="grid gap-5">
      <ChildSwitcher kids={fam.data.children} selected={child.id} onSelect={select} />

      <section aria-labelledby="subjects" className="grid gap-3">
        <h2 id="subjects" className="text-xl">{child.name}&apos;s subjects</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {tracks.map((t) => {
            const lvl = decideLevel(child, t === "gk" ? "science" : t, p.completions, addDays(today, 1), fam.data!.content.ageGroups);
            const count = p.completions.filter((c) => c.track === t && !c.repeat).length;
            return (
              <li key={t}>
                <button onClick={() => setTrack(t)} aria-pressed={active === t}
                  className={`card grid w-full gap-1 p-4 text-left transition ${active === t ? "border-ink" : ""}`}>
                  <span className="flex items-center justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl text-xl ${TINT[toneOf(TRACK_META[t].color)]}`} aria-hidden="true">{TRACK_META[t].icon}</span>
                    <span className="font-display text-2xl font-semibold tnum">{m[t] === null ? "—" : `${m[t]}%`}</span>
                  </span>
                  <span className="font-bold">{TRACK_META[t].progressLabel}</span>
                  <span className="text-xs font-bold text-muted">{count} done · Level {lvl.level}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {active && (
        <section className="card grid gap-3 p-5" aria-labelledby="trend">
          <h2 id="trend" className="text-xl">{TRACK_META[active].progressLabel} scores, last 14 days</h2>
          <TrendChart title={`${TRACK_META[active].progressLabel} daily average score`} tone={toneOf(TRACK_META[active].color)} values={trend} labels={days14.map((d) => fmtDay(d, { month: "short", day: "numeric" }))} />
          <p className="text-sm font-bold text-muted">
            {decideLevel(child, active === "gk" ? "science" : active, p.completions, addDays(today, 1), fam.data.content.ageGroups).reason} Difficulty adjusts automatically, one level at a time.
          </p>
        </section>
      )}

      <section className="card grid gap-3 p-5" aria-labelledby="time">
        <h2 id="time" className="text-xl">Minutes learning, last 14 days</h2>
        <ColumnChart title="Minutes per day" unit="min" tone="science" data={d14.map((d) => ({ key: d.day, label: fmtDay(d.day, { day: "numeric" }), value: d.minutes, detail: `${fmtDay(d.day, { weekday: "short", month: "short", day: "numeric" })} · ${d.activities} activities` }))} />
        <p className="text-sm font-bold text-muted">Average {Math.round(d14.reduce((a, d) => a + d.minutes, 0) / 14)} min/day · limit {child.settings.screenTimeMinutes ? `${child.settings.screenTimeMinutes} min` : "off"}</p>
      </section>

      <section className="card grid gap-3 p-5" aria-labelledby="badges">
        <h2 id="badges" className="text-xl">Achievements ({earned.length}/{fam.data.content.badges.length})</h2>
        {earned.length === 0 ? <p className="text-muted">No badges yet.</p> : (
          <ul className="flex flex-wrap gap-2">
            {earned.map((b) => <li key={b.id} className="chip bg-sun/25" title={b.description}>{b.icon} {b.name}</li>)}
          </ul>
        )}
      </section>

      <section className="card grid gap-3 pt-5" aria-labelledby="history">
        <h2 id="history" className="px-5 text-xl">Learning history</h2>
        <RecentTable p={p} limit={30} />
      </section>
    </div>
  );
}

export function ProgressScreen() { return <ParentShell title="Progress"><Body /></ParentShell>; }
