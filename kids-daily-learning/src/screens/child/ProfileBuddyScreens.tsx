"use client";
import { useEffect, useRef, useState } from "react";
import { ageGroupFor, mastery } from "@/core/engine";
import { SCORED_TRACKS } from "@/core/types";
import { TRACK_META } from "@/core/content/meta";
import { LIMITS } from "@/core/validation";
import { useApp } from "@/state/AppProvider";
import { useChildData } from "@/state/useChild";
import { useNav, Link } from "@/nav/nav";
import { ChildShell } from "@/ui/shells/ChildShell";
import { BuddyBot } from "@/ui/brand";
import { ProgressBar, Skeleton, StatChip, EmptyState } from "@/ui/primitives";
import { toneOf } from "@/ui/colors";
import { ParentGate } from "@/ui/ParentGate";
import { SpeakButton } from "@/ui/quiz/QuestionView";

// ---------------------------------------------------------------- Child profile

function MeBody() {
  const { progress, content, summary } = useChildData();
  const nav = useNav();
  const [gate, setGate] = useState<null | "/profiles" | "/parent">(null);
  if (!progress || !content || !summary) return <Skeleton className="h-96" />;
  const child = progress.child;
  const group = ageGroupFor(child.age, content.ageGroups);
  const m = mastery(progress.completions);
  const tracks = SCORED_TRACKS.filter((t) => child.settings.allowedTracks.includes(t));
  return (
    <div className="grid gap-6">
      <section className="card grid place-items-center gap-2 p-6 text-center">
        <span className="grid h-28 w-28 place-items-center rounded-[2rem] bg-sun/30 text-7xl" aria-hidden="true">{child.avatar}</span>
        <h1 className="text-3xl">{child.name}</h1>
        <p className="chip bg-science/15">🌳 {group.label} · Age {child.age}</p>
      </section>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="My numbers">
        <StatChip icon="⚡" value={summary.xp} label="XP" tone="sun" />
        <StatChip icon="⭐" value={summary.stars} label="Stars" tone="sun" />
        <StatChip icon="🔥" value={progress.streak.longest} label="Best streak" tone="creativity" />
        <StatChip icon="🏆" value={summary.badges} label="Badges" tone="story" />
      </section>
      <section className="card grid gap-4 p-5" aria-labelledby="my-skills">
        <h2 id="my-skills" className="text-2xl">My skills</h2>
        <ul className="grid gap-3">
          {tracks.map((t) => (
            <li key={t} className="grid gap-1">
              <div className="flex justify-between font-bold"><span>{TRACK_META[t].icon} {TRACK_META[t].progressLabel}</span><span className="tnum text-muted">{m[t] === null ? "Not yet" : `${m[t]}%`}</span></div>
              <ProgressBar value={m[t] ?? 0} tone={toneOf(TRACK_META[t].color)} label={`${TRACK_META[t].progressLabel} skill`} size="sm" />
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn-secondary" onClick={() => setGate("/profiles")}>👥 Switch profile</button>
        <button className="btn-secondary" onClick={() => setGate("/parent")}>🔒 Grown-ups</button>
      </div>
      <p className="text-center text-sm font-bold text-muted">Only your first name, age and animal avatar are saved. <Link to="/safety" className="underline">How we keep you safe</Link></p>
      <ParentGate open={gate !== null} onClose={() => setGate(null)} onPass={() => { const to = gate!; setGate(null); nav.go(to); }} />
    </div>
  );
}
export function MeScreen() { return <ChildShell><MeBody /></ChildShell>; }

// ---------------------------------------------------------------- Buddy

interface Msg { from: "child" | "buddy"; text: string; followUp?: string; blocked?: boolean; }

function BuddyBody() {
  const { service } = useApp();
  const { progress, childId } = useChildData();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState(["What is 5 + 3?", "Why is the sky blue?", "What does curious mean?", "Tell me a joke"]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  if (!progress || !childId) return <Skeleton className="h-96" />;
  const child = progress.child;
  if (!child.settings.aiEnabled) {
    return <EmptyState emoji="🤖" title="Buddy is resting" body="A grown-up has switched Buddy off. You can still learn with all your activities!" action={<Link to="/home" className="btn-primary">Back to activities</Link>} />;
  }

  async function send(message: string) {
    const m = message.trim();
    if (!m || busy) return;
    setText("");
    setError(null);
    setMsgs((x) => [...x, { from: "child", text: m }]);
    setBusy(true);
    try {
      const r = await service.askBuddy(childId!, m);
      setMsgs((x) => [...x, { from: "buddy", text: r.text, followUp: r.followUp, blocked: r.blocked }]);
      if (r.suggestions?.length) setSuggestions(r.suggestions);
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <header className="flex items-center gap-4">
        <BuddyBot size={72} mood="wave" className="animate-floaty" />
        <div>
          <h1 className="text-3xl">Buddy 🤖</h1>
          <p className="font-bold text-muted">Your learning helper. Ask about numbers, words, science and more!</p>
        </div>
      </header>
      <p className="rounded-2xl bg-gk/10 px-4 py-3 text-sm font-bold"><span aria-hidden="true">🛡️ </span>Buddy never needs your full name, address, school or photos. If something worries you, tell a grown-up.</p>

      <div className="card grid min-h-[300px] content-start gap-3 p-4" aria-live="polite" aria-label="Conversation with Buddy">
        {msgs.length === 0 && (
          <div className="flex items-start gap-3">
            <BuddyBot size={40} className="shrink-0" />
            <p className="rounded-2xl rounded-tl-md bg-gk/15 px-4 py-3 text-lg">Hi {child.name}! 👋 What are you curious about today?</p>
          </div>
        )}
        {msgs.map((m, i) => m.from === "child" ? (
          <p key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-sun/35 px-4 py-3 text-lg font-bold">{m.text}</p>
        ) : (
          <div key={i} className="flex items-start gap-3">
            <BuddyBot size={40} className="shrink-0" mood={m.blocked ? "thinking" : "happy"} />
            <div className={`max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3 ${m.blocked ? "bg-oops/10" : "bg-gk/15"}`}>
              <p className="text-lg">{m.text}</p>
              {m.followUp && <p className="mt-2 font-bold text-muted">🤔 {m.followUp}</p>}
              <div className="mt-2"><SpeakButton text={`${m.text} ${m.followUp ?? ""}`} label="Hear Buddy's answer" /></div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-3" role="status">
            <BuddyBot size={40} mood="thinking" className="shrink-0" />
            <span className="flex gap-1.5 rounded-2xl bg-gk/15 px-4 py-4" aria-label="Buddy is thinking">
              {[0, 1, 2].map((k) => <span key={k} className="h-2.5 w-2.5 animate-bounce rounded-full bg-gk" style={{ animationDelay: `${k * 0.15}s` }} />)}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p role="alert" className="rounded-2xl bg-oops/10 px-4 py-3 font-bold text-oops">{error}</p>}
      <div className="flex flex-wrap gap-2" aria-label="Question ideas">
        {suggestions.map((s) => <button key={s} className="chip min-h-[44px] bg-surface border-2 border-line hover:border-gk" onClick={() => void send(s)} disabled={busy}>{s}</button>)}
      </div>
      <form className="sticky bottom-24 flex gap-2 lg:bottom-4" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
        <label htmlFor="buddy-input" className="sr-only">Ask Buddy a question</label>
        <input id="buddy-input" className="field flex-1 shadow-soft" value={text} maxLength={LIMITS.buddyMax} onChange={(e) => setText(e.target.value)} placeholder="Ask Buddy a question…" autoComplete="off" />
        <button type="submit" className="btn-primary" disabled={!text.trim() || busy}>Ask</button>
      </form>
    </div>
  );
}
export function BuddyScreen() { return <ChildShell><BuddyBody /></ChildShell>; }
