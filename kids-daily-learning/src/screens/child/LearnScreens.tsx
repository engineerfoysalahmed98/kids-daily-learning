"use client";
import { useMemo } from "react";
import type { Level, SubjectId, Track } from "@/core/types";
import { baseLevel, mastery, practiceId, unitsFor } from "@/core/engine";
import { useChildData } from "@/state/useChild";
import { Link, useNav } from "@/nav/nav";
import { ChildShell } from "@/ui/shells/ChildShell";
import { Blob, ProgressBar, Skeleton, EmptyState } from "@/ui/primitives";
import { toneOf, BORDER } from "@/ui/colors";
import { BackButton, DifficultyDots, NotFound } from "./shared";

const SUBJECT_TRACKS: Record<SubjectId, Track[]> = {
  english: ["english", "story"], math: ["math", "brain"], science: ["science"], gk: ["gk"], creativity: ["creativity"], habits: ["habit"],
};

function LearnBody() {
  const { progress, content } = useChildData();
  if (!progress || !content) return <Skeleton className="h-96" />;
  const m = mastery(progress.completions);
  const allowed = progress.child.settings.allowedTracks;
  const subjects = content.subjects.filter((s) => s.enabled && SUBJECT_TRACKS[s.id].some((t) => allowed.includes(t)));
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">Learn 📚</h1>
        <p className="font-bold text-muted">Pick a subject to practise anything you like.</p>
      </div>
      <Link to="/bangla-math" lang="bn" className="card flex items-center gap-4 border-gk/50 bg-gk/10 p-4 transition hover:-translate-y-0.5">
        <Blob tone="gk" emoji="🔢" />
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold">বাংলা সংখ্যা ও গণিত</span>
          <span className="block text-sm font-bold text-muted">১–১০০ · যোগ · বিয়োগ · গুণ · ভাগ — বাংলায়</span>
        </span>
        <span className="ml-auto text-2xl" aria-hidden="true">→</span>
      </Link>
      {subjects.length === 0 ? <EmptyState title="No subjects switched on" body="Ask a grown-up to turn subjects on in Parent Settings." /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => {
            const track = SUBJECT_TRACKS[s.id][0];
            const tone = toneOf(s.color);
            const pct = m[track];
            const count = progress.completions.filter((c) => SUBJECT_TRACKS[s.id].includes(c.track) && !c.repeat).length;
            return (
              <Link key={s.id} to={`/learn/${s.id}`} className={`card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 ${BORDER[tone]}`}>
                <div className="flex items-center gap-4">
                  <Blob tone={tone} emoji={s.icon} size="lg" />
                  <div className="min-w-0">
                    <h2 className="text-2xl">{s.name}</h2>
                    <p className="text-sm font-bold text-muted">{s.topics.slice(0, 3).join(" · ")}{s.topics.length > 3 ? " …" : ""}</p>
                  </div>
                </div>
                {pct !== null && pct !== undefined ? (
                  <div className="grid gap-1">
                    <div className="flex justify-between text-sm font-extrabold"><span className="text-muted">Mastery</span><span className="tnum">{pct}%</span></div>
                    <ProgressBar value={pct} tone={tone} label={`${s.name} mastery`} size="sm" />
                  </div>
                ) : (
                  <p className="text-sm font-extrabold text-muted">{count ? `${count} activities done` : "Not started yet — try it! ✨"}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LearnScreen() { return <ChildShell><LearnBody /></ChildShell>; }

function PracticeTile({ to, icon, title, sub, level, tone }: { to: string; icon: string; title: string; sub: string; level?: number; tone: ReturnType<typeof toneOf> }) {
  return (
    <Link to={to} className={`card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 ${BORDER[tone]}`}>
      <Blob tone={tone} emoji={icon} />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold leading-tight">{title}</span>
        <span className="block text-sm font-bold text-muted">{sub}</span>
        {level !== undefined && <span className="mt-1 block"><DifficultyDots level={level} /></span>}
      </span>
      <span className="btn-primary btn-sm" aria-hidden="true">Go</span>
    </Link>
  );
}

function SubjectBody() {
  const { params } = useNav();
  const { progress, content } = useChildData();
  const seed = useMemo(() => Math.floor(Math.random() * 1e8), []);
  if (!progress || !content) return <Skeleton className="h-96" />;
  const subject = content.subjects.find((s) => s.id === params.subject);
  if (!subject || !subject.enabled) return <NotFound what="subject" />;
  const child = progress.child;
  const base = baseLevel(child.age, content.ageGroups);
  const levels = ([base - 1, base, base + 1].filter((l) => l >= 1 && l <= 5)) as Level[];
  const tone = toneOf(subject.color);
  const allowed = child.settings.allowedTracks;
  const doneIds = new Set(progress.completions.map((c) => c.activityId));

  let body: React.ReactNode = null;
  if (subject.id === "english" || subject.id === "math") {
    const main: Track = subject.id;
    const extra: Track = subject.id === "english" ? "story" : "brain";
    body = (
      <>
        {allowed.includes(main) && (
          <section className="grid gap-3">
            <h2 className="text-xl">{subject.id === "english" ? "Word practice" : "Number practice"}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {levels.map((l) => (
                <PracticeTile key={l} tone={tone} to={`/${subject.id === "english" ? "lesson" : "quiz"}/${encodeURIComponent(practiceId(main, l, seed + l))}`}
                  icon={l < base ? "🌱" : l === base ? subject.icon : "🚀"} title={l < base ? "Warm-up" : l === base ? "Just right" : "Challenge"} sub={`Level ${l}`} level={l} />
              ))}
            </div>
          </section>
        )}
        {allowed.includes(extra) && (
          <section className="grid gap-3">
            <h2 className="text-xl">{extra === "story" ? "Reading" : "Logic & puzzles"}</h2>
            {extra === "story"
              ? <PracticeTile tone={toneOf("story")} to="/stories" icon="📖" title="Story time" sub="Read or listen to a story, then answer questions" />
              : <PracticeTile tone={toneOf("brain")} to={`/quiz/${encodeURIComponent(practiceId("brain", base, seed))}`} icon="🧠" title="Brain Workout" sub="Patterns, codes and logic puzzles" level={base} />}
          </section>
        )}
      </>
    );
  } else if (subject.id === "science" || subject.id === "gk") {
    const units = content.units.filter((u) => u.subject === subject.id).sort((a, b) => Math.abs(a.level - base) - Math.abs(b.level - base) || a.level - b.level);
    const recommended = new Set(unitsFor(content, subject.id, base).map((u) => u.id));
    body = allowed.includes(subject.id) ? (
      <section className="grid gap-3">
        <h2 className="text-xl">Topics</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {units.map((u) => (
            <PracticeTile key={u.id} tone={tone} to={`/lesson/${encodeURIComponent(`u.${u.id}`)}`} icon={u.icon} title={u.title}
              sub={`${u.topic}${recommended.has(u.id) ? " · Picked for you ⭐" : ""}${doneIds.has(`u.${u.id}`) ? " · Done ✓" : ""}`} level={u.level} />
          ))}
        </div>
      </section>
    ) : null;
  } else if (subject.id === "creativity") {
    body = allowed.includes("creativity") ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {content.creative.filter((p) => child.age >= p.minAge).map((p) => <PracticeTile key={p.id} tone={tone} to={`/create/${encodeURIComponent(`c.${p.id}`)}`} icon={p.icon} title={p.title} sub={p.prompt} />)}
      </div>
    ) : null;
  } else {
    body = allowed.includes("habit") ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {content.habits.filter((h) => child.age >= h.minAge).map((h) => <PracticeTile key={h.id} tone={tone} to={`/habit/${encodeURIComponent(`h.${h.id}`)}`} icon={h.icon} title={h.title} sub={h.why} />)}
      </div>
    ) : null;
  }

  return (
    <div className="grid gap-6">
      <BackButton fallback="/learn" label="All subjects" />
      <header className="flex items-center gap-4">
        <Blob tone={tone} emoji={subject.icon} size="xl" />
        <div>
          <h1 className="text-3xl sm:text-4xl">{subject.name}</h1>
          <ul className="mt-2 flex flex-wrap gap-1.5">{subject.topics.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
        </div>
      </header>
      {body ?? <EmptyState title="This subject is switched off" body="Ask a grown-up if you'd like to try it." />}
    </div>
  );
}

export function SubjectScreen() { return <ChildShell><SubjectBody /></ChildShell>; }
