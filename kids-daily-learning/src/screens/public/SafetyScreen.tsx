"use client";
import { PublicShell } from "@/ui/shells/PublicShell";

const SECTIONS: { icon: string; title: string; points: string[] }[] = [
  { icon: "🔒", title: "What we collect", points: [
    "Parent: email, first name and a securely hashed password.",
    "Child: a first name or nickname, an age (4–12) and an emoji avatar. No surnames, birthdays, photos, schools, voice recordings or locations.",
    "Learning records: which activities were finished, scores, stars, XP, badges, streaks and minutes used — so you can see progress.",
    "Drawings made in the app stay on the device and are not uploaded.",
  ] },
  { icon: "🤖", title: "Buddy, the AI helper", points: [
    "Buddy is for learning: numbers, words, science, nature and everyday knowledge. It teaches step by step instead of just giving answers.",
    "Every message is checked before and after the AI sees it. Personal details (addresses, phone numbers, schools, passwords) are blocked and never stored.",
    "Buddy never asks for personal information, never suggests keeping secrets from parents, and redirects dangerous, scary or grown-up topics to a trusted adult.",
    "If a child writes something that suggests they're upset or unsafe, Buddy encourages them to talk to a trusted grown-up straight away.",
    "Parents can switch Buddy off for each child. Requests are rate-limited, and we do not keep chat transcripts.",
  ] },
  { icon: "👨‍👩‍👧", title: "Parents stay in control", points: [
    "Daily learning goals, screen-time limits, allowed subjects, AI on/off, sound and notifications are set per child.",
    "A parent gate (or your 4-digit PIN) keeps children out of the parent area.",
    "You can edit or delete a child's profile at any time. Deleting removes all of that child's learning records.",
  ] },
  { icon: "🌈", title: "Healthy rewards", points: [
    "Stars, XP, streaks and badges celebrate effort. There are no loot boxes, countdown timers, loss mechanics or purchases.",
    "Mistakes are met with “Almost! Let's learn this together.” — never a buzzer or a red cross.",
    "Missing a day just starts a fresh streak; nothing is taken away.",
    "When the screen-time limit is reached, children see a friendly break screen.",
  ] },
  { icon: "🛡️", title: "How data is protected", points: [
    "Passwords are hashed with bcrypt; sessions use signed, httpOnly, same-site cookies.",
    "Every request checks that the child belongs to the logged-in parent. Children can't open parent pages or other profiles.",
    "All input is validated on the server; database queries are parameterized through Prisma.",
    "No advertising SDKs, tracking pixels or third-party analytics on child screens.",
  ] },
];

export function SafetyScreen() {
  return (
    <PublicShell>
      <article className="mx-auto grid max-w-3xl gap-8 px-4 py-8">
        <header className="grid gap-3">
          <p className="label">Privacy & Safety</p>
          <h1 className="text-4xl sm:text-5xl">Our safety promise</h1>
          <p className="text-xl text-muted">Kids Daily Learning is made for children. Every design decision starts with one question: would we be happy with this for our own kids?</p>
        </header>
        {SECTIONS.map((s) => (
          <section key={s.title} className="card grid gap-3 p-6" aria-labelledby={`s-${s.icon}`}>
            <h2 id={`s-${s.icon}`} className="flex items-center gap-3 text-2xl"><span aria-hidden="true">{s.icon}</span>{s.title}</h2>
            <ul className="grid gap-2.5">
              {s.points.map((p) => <li key={p} className="flex gap-3 text-lg leading-relaxed"><span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-gk" aria-hidden="true" />{p}</li>)}
            </ul>
          </section>
        ))}
        <p className="text-muted">Questions about privacy? Contact <span className="select-all font-bold text-ink">privacy@kidsdaily.app</span>. This page describes the product design; have your legal team review it against COPPA, GDPR-K and your local requirements before launch.</p>
      </article>
    </PublicShell>
  );
}
