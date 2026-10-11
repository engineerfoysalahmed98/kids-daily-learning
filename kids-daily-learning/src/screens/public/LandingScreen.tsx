"use client";
import { SUBJECTS, BADGES } from "@/core/content/meta";
import { Link } from "@/nav/nav";
import { useApp } from "@/state/AppProvider";
import { PublicShell } from "@/ui/shells/PublicShell";
import { BuddyBot } from "@/ui/brand";
import { Blob, ProgressBar } from "@/ui/primitives";
import { TINT, toneOf, type Tone } from "@/ui/colors";

const SAMPLE: { icon: string; subject: string; title: string; tone: Tone; min: number }[] = [
  { icon: "🔤", subject: "English", title: "Learn 5 new words", tone: "english", min: 6 },
  { icon: "🔢", subject: "Math", title: "Addition Challenge", tone: "math", min: 5 },
  { icon: "🦒", subject: "Science", title: "Amazing Animals", tone: "science", min: 5 },
  { icon: "📖", subject: "Story", title: "The Little Explorer", tone: "story", min: 7 },
  { icon: "🧠", subject: "Brain Game", title: "Pattern Puzzle", tone: "brain", min: 4 },
  { icon: "🏠", subject: "Creativity", title: "Draw Your Dream House", tone: "creativity", min: 10 },
  { icon: "📚", subject: "Good Habit", title: "Organize Your Study Table", tone: "habit", min: 5 },
];

const FAQ = [
  { q: "What ages is Kids Daily Learning for?", a: "Children aged 4 to 12. Activities adapt to each child's age and to how they're doing, so a 5-year-old counts to 20 while an 11-year-old works on fractions." },
  { q: "How long does it take each day?", a: "About 20–40 minutes for the full daily adventure (5–7 short activities). You set the daily goal and a screen-time limit for each child." },
  { q: "Is Buddy the AI assistant safe?", a: "Buddy only discusses learning topics, never asks for personal information, never suggests keeping secrets, and is rate-limited. You can switch Buddy off for each child." },
  { q: "What do you store about my child?", a: "A first name or nickname, an age and an emoji avatar — plus their learning progress. No photos, birthdays, schools or locations. Drawings stay on the device." },
  { q: "Are there ads or in-app purchases?", a: "No. There's nothing to buy inside the app and no ads, ever. Rewards are stars, XP and badges that celebrate effort." },
];

export function LandingScreen() {
  const { session } = useApp();
  // No account needed: logged-out visitors go straight to learning (as a guest).
  const start = session?.parent && session.mode !== "child" ? "/profiles" : "/home";
  return (
    <PublicShell>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12">
        <div className="grid gap-5">
          <p className="chip w-fit bg-science/15">🌱 For curious kids aged 4–12</p>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl">
            Learn. Play. Grow.<br /><span className="relative inline-block">Every Day.<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8c50-6 110-7 196-2" stroke="rgb(var(--sun))" strokeWidth="6" fill="none" strokeLinecap="round" /></svg></span> 🌟
          </h1>
          <p className="max-w-xl text-xl text-muted">Fun daily activities that help children build knowledge, creativity and healthy habits.</p>
          <div className="flex flex-wrap gap-3">
            <Link to={start} className="btn-primary px-7 text-xl">Start Learning</Link>
          </div>
          <p className="text-sm font-bold text-muted">No ads · No in-app purchases · Parents in control</p>
          <Link to="/bangla-math" lang="bn" className="card flex items-center gap-4 border-gk/50 bg-gk/10 p-4 transition hover:-translate-y-0.5">
            <span className="text-4xl" aria-hidden="true">🔢</span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold">বাংলা সংখ্যা ও গণিত — এখনই শুরু করো</span>
              <span className="block text-sm font-bold text-muted">১–১০০, যোগ, বিয়োগ, গুণ, ভাগ · লগইন বা ইমেইল লাগবে না</span>
            </span>
            <span className="ml-auto text-2xl" aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Product preview: a real "Today's Adventure" */}
        <div className="relative mx-auto w-full max-w-md" aria-label="Preview of a child's daily adventure" role="img">
          <div className="card relative grid gap-3 p-4 shadow-soft" aria-hidden="true">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sun/30 text-3xl">🦁</span>
              <div>
                <p className="font-display text-xl font-semibold">Hi, Ayaan! 👋</p>
                <p className="text-sm font-bold text-muted">You&apos;re on a 7-day learning streak! 🚀</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-sun/25 py-2"><p className="font-display text-lg font-semibold">⚡ 842</p><p className="text-xs font-bold text-muted">XP</p></div>
              <div className="rounded-2xl bg-flame/15 py-2"><p className="font-display text-lg font-semibold">🔥 7</p><p className="text-xs font-bold text-muted">Streak</p></div>
              <div className="rounded-2xl bg-story/15 py-2"><p className="font-display text-lg font-semibold">🏆 9</p><p className="text-xs font-bold text-muted">Badges</p></div>
            </div>
            <p className="label mt-1">Today&apos;s Adventure</p>
            {SAMPLE.slice(0, 4).map((a, i) => (
              <div key={a.title} className="flex items-center gap-3 rounded-2xl border-2 border-line p-2.5">
                <Blob tone={a.tone} emoji={a.icon} size="sm" />
                <div className="min-w-0 flex-1"><p className="text-xs font-extrabold uppercase tracking-wider text-muted">{a.subject}</p><p className="truncate font-bold">{a.title}</p></div>
                {i < 2 ? <span className="grid h-8 w-8 place-items-center rounded-full bg-good text-sm text-white">✓</span> : <span className="rounded-xl bg-sun px-3 py-1.5 text-sm font-extrabold text-[#1D2340]">Start</span>}
              </div>
            ))}
          </div>
          <div className="absolute -bottom-6 -left-4 flex items-center gap-2 rounded-2xl border-2 border-line bg-surface p-2 pr-4 shadow-soft sm:-left-10" aria-hidden="true">
            <BuddyBot size={46} mood="wave" />
            <p className="max-w-[11rem] text-sm font-bold">5 + 3? Let&apos;s count together! 5… 6… 7… 8! 🎉</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="how">
        <h2 id="how" className="text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: "👨‍👩‍👧", t: "Add your child", d: "Create a profile with a first name, age and animal avatar. That's all we need." },
            { icon: "🗺️", t: "A fresh adventure every day", d: "5–7 short activities matched to your child's age and progress: lessons, quizzes, stories, games and habits." },
            { icon: "📈", t: "See them grow", d: "Scores, streaks and badges show up on your dashboard, with gentle suggestions for what to practise." },
          ].map((s, i) => (
            <li key={s.t} className="card grid gap-2 p-5">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-lg text-bg">{i + 1}</span><span className="text-3xl" aria-hidden="true">{s.icon}</span></div>
              <h3 className="text-xl">{s.t}</h3>
              <p className="text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Daily activities */}
      <section className="bg-surface py-14" aria-labelledby="daily">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="daily" className="text-3xl sm:text-4xl">A day of learning for a 7-year-old</h2>
          <p className="mt-2 max-w-2xl text-lg text-muted">Every activity is short, playful and finishes with stars — never a red cross.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE.map((a) => (
              <li key={a.title} className={`flex items-center gap-3 rounded-card p-4 ${TINT[a.tone]}`}>
                <span className="text-4xl" aria-hidden="true">{a.icon}</span>
                <span><span className="block text-xs font-extrabold uppercase tracking-wider text-muted">{a.subject} · {a.min} min</span><span className="block font-display text-lg font-semibold leading-tight">{a.title}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Subjects */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="subjects">
        <h2 id="subjects" className="text-3xl sm:text-4xl">Learning subjects</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((s) => (
            <li key={s.id} className="card flex gap-4 p-5">
              <Blob tone={toneOf(s.color)} emoji={s.icon} size="lg" />
              <div><h3 className="text-xl">{s.name}</h3><p className="text-sm font-bold text-muted">{s.topics.join(" · ")}</p></div>
            </li>
          ))}
        </ul>
      </section>

      {/* Rewards + parent dashboard */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-2">
        <div className="card grid content-start gap-4 p-6" aria-labelledby="rewards">
          <h2 id="rewards" className="text-3xl">Rewards that celebrate effort</h2>
          <p className="text-muted">Stars, XP, streaks and badges — with no loss mechanics, no countdowns and nothing to buy. Missed a day? The streak simply starts fresh.</p>
          <ul className="flex flex-wrap gap-2">
            {BADGES.slice(0, 9).map((b) => <li key={b.id} className="chip bg-sun/25">{b.icon} {b.name}</li>)}
          </ul>
        </div>
        <div className="card grid content-start gap-4 p-6" aria-labelledby="parents">
          <h2 id="parents" className="text-3xl">A calm dashboard for parents</h2>
          <p className="text-muted">See scores, time spent and progress per subject, and set daily goals, screen-time limits, subjects and AI access for each child.</p>
          <div className="grid gap-2.5 rounded-2xl bg-sunken p-4" aria-label="Example progress">
            {[["English", 78, "english"], ["Math", 72, "math"], ["Science", 85, "science"], ["Reading", 80, "story"]].map(([n, v, t]) => (
              <div key={n as string} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm font-bold">
                <span>{n}</span><ProgressBar value={v as number} tone={t as Tone} label={`${n} ${v}%`} size="sm" /><span className="tnum text-right">{v}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="safety">
        <div className="grid gap-6 rounded-[2rem] bg-gk/10 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid content-start gap-3">
            <h2 id="safety" className="text-3xl sm:text-4xl">Built safe from the start</h2>
            <p className="text-lg text-muted">We designed Kids Daily Learning the way we&apos;d want it for our own children.</p>
            <Link to="/safety" className="btn-secondary w-fit">Read our safety promise</Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ["🔒", "Minimal data", "First name, age and avatar only."],
              ["🤖", "Safe AI helper", "Learning topics only, filtered both ways, rate-limited."],
              ["👨‍👩‍👧", "Parents in control", "Screen time, subjects, AI and notifications."],
              ["🚫", "No ads, no chat", "No strangers, no purchases, no tracking pixels."],
            ].map(([i, t, d]) => (
              <li key={t} className="flex gap-3 rounded-2xl bg-surface p-4"><span className="text-3xl" aria-hidden="true">{i}</span><span><span className="block font-bold">{t}</span><span className="block text-sm text-muted">{d}</span></span></li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-6" aria-labelledby="faq">
        <h2 id="faq" className="text-3xl sm:text-4xl">Questions parents ask</h2>
        <div className="mt-6 grid gap-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group p-5">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-semibold">
                {f.q}<span className="text-2xl transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 grid place-items-center gap-3 text-center">
          <p className="font-display text-2xl font-semibold">Ready for today&apos;s adventure?</p>
          <Link to={start} className="btn-primary px-8 text-xl">Start Learning</Link>
        </div>
      </section>
    </PublicShell>
  );
}
