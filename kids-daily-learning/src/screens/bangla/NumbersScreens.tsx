"use client";
import { useEffect, useMemo, useState } from "react";
import {
  bnName, markGroupSeen, NUMBER_GROUPS, NUMBERS, numberInfo, numbersInGroup, OBJECTS, placeValueText, toBn, type NumberInfo,
} from "@/core/bangla";
import { Link, useNav } from "@/nav/nav";
import { getBnProgress, updateBnProgress, useBnProgress } from "@/state/bnGuestStore";
import { SpeakButton } from "@/ui/quiz/QuestionView";
import { playSfx } from "@/ui/effects";
import { BadgeList, BanglaShell, BnNotFound, HUB } from "./shared";
import type { BnBadge } from "@/core/bangla";

// ---------------------------------------------------------------- overview: ১–১০০

function NumbersBody() {
  const { progress } = useBnProgress();
  return (
    <>
      <section className="grid gap-2">
        <h1 className="text-3xl sm:text-4xl">সংখ্যা ১–১০০ 🔢</h1>
        <p className="text-lg text-muted">দশটি করে দলে ভাগ করা আছে। একটা দল বেছে নাও, সংখ্যাগুলো দেখো, শোনো আর গুনে দেখো।</p>
      </section>

      <section aria-labelledby="groups" className="grid gap-3">
        <h2 id="groups" className="text-2xl">দশের দল</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {NUMBER_GROUPS.map((g) => {
            const seen = progress.groupsSeen.includes(g.id);
            const best = progress.quizzes[`numbers-g${g.id}`]?.bestPct;
            return (
              <Link key={g.id} to={`${HUB}/numbers/${g.id}`} className={`card grid min-h-[96px] place-items-center gap-1 p-3 text-center transition hover:-translate-y-0.5 ${seen ? "border-good/50" : "border-gk/40"}`}>
                <span className="text-3xl" aria-hidden="true">{g.emoji}</span>
                <span className="font-display text-lg font-semibold">{g.title}</span>
                <span className="text-xs font-bold text-muted">{g.from}–{g.to}{seen ? " · ✅ দেখা হয়েছে" : ""}{best !== undefined ? ` · সেরা ${toBn(best)}%` : ""}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="chart" className="card grid gap-3 p-4 sm:p-5">
        <h2 id="chart" className="text-2xl">শতক বোর্ড (১০০ পর্যন্ত)</h2>
        <p className="text-sm font-bold text-muted">যেকোনো সংখ্যায় চাপ দিলে তার নাম আর ছবি দেখবে। প্রতিটি সারিতে ১০টি সংখ্যা।</p>
        <ol className="grid grid-cols-10 gap-1" aria-label="১ থেকে ১০০ পর্যন্ত সংখ্যা">
          {NUMBERS.map((x) => (
            <li key={x.n}>
              <Link to={`${HUB}/numbers/${Math.ceil(x.n / 10)}?n=${x.n}`} aria-label={`${x.bn} — ${x.bnName} (${x.n})`}
                className={`grid aspect-square place-items-center rounded-lg text-center leading-none transition hover:bg-gk/25 ${x.n % 10 === 0 ? "bg-gk/20" : "bg-sunken"}`}>
                <span className="font-display text-sm font-semibold sm:text-lg">{x.bn}</span>
                <span className="hidden text-[0.65rem] font-bold text-muted sm:block">{x.n}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="card grid gap-3 p-5" aria-labelledby="games">
        <h2 id="games" className="text-2xl">সংখ্যার খেলা 🎮</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {([1, 2, 3] as const).map((l) => (
            <Link key={l} to={`${HUB}/quiz/numbers-${l}`} className="btn-secondary">
              {l === 1 ? "সহজ · ১–১০" : l === 2 ? "মাঝারি · ১–৫০" : "কঠিন · ১–১০০"}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export function BnNumbersScreen() {
  return <BanglaShell back={{ to: HUB, label: "বাংলা গণিত" }}><NumbersBody /></BanglaShell>;
}

// ---------------------------------------------------------------- one group of ten

/** 10 × 10 board with the first n cells filled: every row is one দশ. */
function HundredBoard({ n }: { n: number }) {
  const rows = Math.max(1, Math.ceil(n / 10));
  return (
    <div role="img" aria-label={`${toBn(n)} = ${placeValueText(n)}`} className="grid gap-1">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid grid-cols-10 gap-1">
          {Array.from({ length: 10 }, (_, c) => {
            const i = r * 10 + c + 1;
            return <span key={c} className={`h-4 rounded sm:h-5 ${i <= n ? (r % 2 ? "bg-math" : "bg-gk") : "bg-sunken"}`} />;
          })}
        </div>
      ))}
    </div>
  );
}

/** Tap each object in turn; the child hears/sees ১, ২, ৩ … */
function CountingGame({ n, soundOn }: { n: number; soundOn: boolean }) {
  const obj = useMemo(() => OBJECTS[n % OBJECTS.length], [n]);
  const [counted, setCounted] = useState(0); // remounted (key) for each number
  const done = counted >= n;
  return (
    <div className="grid gap-3 rounded-3xl bg-sunken p-4">
      <p className="font-bold">👆 গুনে দেখো: প্রতিটি ছবিতে একবার করে চাপ দাও।</p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: n }, (_, i) => {
          const isCounted = i < counted;
          return (
            <button key={i} type="button" disabled={isCounted || i !== counted}
              onClick={() => { setCounted(i + 1); playSfx(i + 1 === n ? "complete" : "tap", soundOn); }}
              aria-label={isCounted ? `${toBn(i + 1)} গোনা হয়েছে` : i === counted ? `${toBn(i + 1)} নম্বর ${obj.name} গোনো` : `${obj.name}`}
              className={`grid min-h-[56px] place-items-center rounded-2xl border-[3px] text-3xl transition ${isCounted ? "border-good bg-good/15" : i === counted ? "border-sun bg-surface animate-pulse" : "border-line bg-surface opacity-80"}`}>
              <span aria-hidden="true">{obj.emoji}</span>
              {isCounted && <span className="font-display text-base font-semibold">{toBn(i + 1)}</span>}
            </button>
          );
        })}
      </div>
      <p role="status" aria-live="polite" className="font-display text-xl font-semibold">
        {done ? `দারুণ! মোট ${toBn(n)}টি ${obj.name}। 🎉` : counted ? `এ পর্যন্ত ${toBn(counted)}টি …` : " "}
      </p>
      {done && <button type="button" className="btn-ghost btn-sm w-fit" onClick={() => setCounted(0)}>🔁 আবার গুনি</button>}
    </div>
  );
}

function NumberDetail({ x, soundOn }: { x: NumberInfo; soundOn: boolean }) {
  return (
    <section className="card grid gap-4 border-gk/40 p-5" aria-labelledby="num-title" aria-live="polite">
      <div className="flex flex-wrap items-center gap-4">
        <span id="num-title" className="grid h-28 min-w-[7rem] place-items-center rounded-[2rem] bg-gk/20 px-4 font-display text-6xl font-semibold" aria-label={`${x.bn}, ${x.bnName}`}>{x.bn}</span>
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="flex items-center gap-2 font-display text-3xl font-semibold">{x.bnName}<SpeakButton text={x.bnName} lang="bn" label={`${x.bnName} শুনে নাও`} /></p>
          <p lang="en" className="flex items-center gap-2 text-xl font-bold text-muted">
            <span className="rounded-xl bg-sunken px-2 font-display text-2xl text-ink">{x.en}</span> {x.enName}
            <SpeakButton text={x.enName} lang="en" label={`Hear ${x.enName}`} />
          </p>
          <p className="text-sm font-bold text-muted">{placeValueText(x.n)}</p>
        </div>
      </div>
      <HundredBoard n={x.n} />
      {x.n <= 20 && <CountingGame key={x.n} n={x.n} soundOn={soundOn} />}
      {x.n > 1 && x.n < 100 && (
        <p className="font-bold">আগে <span className="font-display text-lg">{toBn(x.n - 1)}</span> ({bnName(x.n - 1)}), পরে <span className="font-display text-lg">{toBn(x.n + 1)}</span> ({bnName(x.n + 1)})।</p>
      )}
    </section>
  );
}

function GroupBody() {
  const { params } = useNav();
  const groupId = Number(params.group);
  const group = NUMBER_GROUPS.find((g) => g.id === groupId);
  const { progress } = useBnProgress();
  const [selected, setSelected] = useState<number | null>(null);
  const [badges, setBadges] = useState<BnBadge[]>([]);

  useEffect(() => {
    if (!group) return;
    // Preselect ?n=27 from the hundred board.
    const q = Number(new URLSearchParams(window.location.search).get("n"));
    setSelected(q >= group.from && q <= group.to ? q : group.from);
    const r = markGroupSeen(getBnProgress(), group.id, new Date().toISOString());
    if (r.progress !== getBnProgress()) updateBnProgress(() => r.progress);
    setBadges(r.newBadges);
  }, [group]);

  if (!group) return <BnNotFound />;
  const nums = numbersInGroup(group.id);
  const prev = NUMBER_GROUPS[group.id - 2];
  const next = NUMBER_GROUPS[group.id];
  return (
    <>
      <section className="grid gap-1">
        <h1 className="text-3xl sm:text-4xl">{group.emoji} সংখ্যা {group.title}</h1>
        <p className="text-muted">একটি সংখ্যায় চাপ দাও। বাংলা আর ইংরেজি — দুইভাবেই দেখো।</p>
      </section>
      <BadgeList badges={badges} />
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10" role="group" aria-label={`সংখ্যা ${group.title}`}>
        {nums.map((x) => (
          <button key={x.n} type="button" aria-pressed={selected === x.n} onClick={() => setSelected(x.n)}
            aria-label={`${x.bn}, ${x.bnName}, ${x.n}`}
            className={`grid min-h-[72px] place-items-center rounded-2xl border-[3px] leading-tight transition ${selected === x.n ? "border-gk bg-gk/20" : "border-line bg-surface hover:border-gk"}`}>
            <span className="font-display text-2xl font-semibold">{x.bn}</span>
            <span className="text-xs font-bold text-muted">{x.n}</span>
          </button>
        ))}
      </div>
      {selected !== null && <NumberDetail x={numberInfo(selected)} soundOn={progress.soundOn} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to={`${HUB}/quiz/numbers-g${group.id}`} className="btn-primary sm:col-span-3">🎮 এই দলের সংখ্যা চেনার খেলা</Link>
        {prev ? <Link to={`${HUB}/numbers/${prev.id}`} className="btn-secondary">← {prev.title}</Link> : <span />}
        <Link to={`${HUB}/numbers`} className="btn-secondary">সব সংখ্যা</Link>
        {next ? <Link to={`${HUB}/numbers/${next.id}`} className="btn-secondary">{next.title} →</Link> : <span />}
      </div>
    </>
  );
}

export function BnNumberGroupScreen() {
  return <BanglaShell back={{ to: `${HUB}/numbers`, label: "সব সংখ্যা" }}><GroupBody /></BanglaShell>;
}
