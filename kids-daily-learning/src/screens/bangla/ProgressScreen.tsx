"use client";
import { BN_BADGES, BN_LEVELS, BN_TOPICS, LEVEL_NAME, NUMBER_GROUPS, OP_IDS, OP_LESSONS, PASS_PCT, toBn, TOPIC_META } from "@/core/bangla";
import { updateBnProgress, useBnProgress } from "@/state/bnGuestStore";
import { Link } from "@/nav/nav";
import { ProgressBar, Toggle } from "@/ui/primitives";
import { BanglaShell, HUB } from "./shared";

function ProgressBody() {
  const { progress, loaded } = useBnProgress();
  const earned = new Set(progress.badges.map((b) => b.id));
  const attempts = Object.values(progress.quizzes).reduce((s, q) => s + q.attempts, 0);
  const passedCount = Object.values(progress.quizzes).filter((q) => q.bestPct >= PASS_PCT).length;
  if (!loaded) return <p className="text-muted">লোড হচ্ছে…</p>;
  return (
    <>
      <section className="grid gap-1">
        <h1 className="text-3xl sm:text-4xl">আমার অগ্রগতি 🏆</h1>
        <p className="text-muted">তুমি যা শিখেছ, সব এখানে। ভুল হলে কিছুই কমে না — শুধু শেখা বাড়ে!</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="সংক্ষেপে">
        {[
          { icon: "⭐", v: progress.stars, l: "মোট তারা", c: "bg-sun/25" },
          { icon: "🏅", v: progress.badges.length, l: "ব্যাজ", c: "bg-story/15" },
          { icon: "🎮", v: attempts, l: "খেলা খেলেছ", c: "bg-math/15" },
          { icon: "✅", v: passedCount, l: "স্তর পার", c: "bg-science/15" },
        ].map((x) => (
          <div key={x.l} className={`rounded-2xl px-3 py-3 ${x.c}`}>
            <p className="font-display text-2xl font-semibold"><span aria-hidden="true">{x.icon}</span> {toBn(x.v)}</p>
            <p className="text-sm font-extrabold text-muted">{x.l}</p>
          </div>
        ))}
      </section>

      <section className="card grid gap-4 p-5" aria-labelledby="levels">
        <h2 id="levels" className="text-2xl">খেলার স্তর</h2>
        <ul className="grid gap-3">
          {BN_TOPICS.map((t) => (
            <li key={t} className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-center">
              <span className="font-display text-xl font-semibold">{TOPIC_META[t].icon} {TOPIC_META[t].bn}</span>
              <span className="grid grid-cols-3 gap-2">
                {BN_LEVELS.map((l) => {
                  const q = progress.quizzes[`${t}-${l}`];
                  return (
                    <Link key={l} to={`${HUB}/quiz/${t}-${l}`} className={`rounded-xl border-2 px-2 py-1.5 text-center text-sm font-bold ${q && q.bestPct >= PASS_PCT ? "border-good bg-good/10" : "border-line"}`}
                      aria-label={`${TOPIC_META[t].bn} ${LEVEL_NAME[l]}: ${q ? `সেরা ${toBn(q.bestPct)}%` : "এখনো খেলোনি"}`}>
                      {LEVEL_NAME[l]}<span className="block text-xs text-muted">{q ? `${q.bestPct >= PASS_PCT ? "✅ " : ""}${toBn(q.bestPct)}%` : "—"}</span>
                    </Link>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card grid gap-3 p-5" aria-labelledby="explored">
        <h2 id="explored" className="text-2xl">যা দেখেছ</h2>
        <div className="grid gap-1">
          <p className="font-bold">সংখ্যার দল: {toBn(progress.groupsSeen.length)} / ১০</p>
          <ProgressBar value={progress.groupsSeen.length} max={NUMBER_GROUPS.length} tone="gk" label="দেখা সংখ্যার দল" size="sm" />
        </div>
        <p className="font-bold">পাঠ: {OP_IDS.map((o) => `${progress.lessonsSeen.includes(o) ? "✅" : "⬜"} ${OP_LESSONS[o].bn}`).join("  ")}</p>
      </section>

      <section className="grid gap-3" aria-labelledby="badges">
        <h2 id="badges" className="text-2xl">ব্যাজ</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BN_BADGES.map((b) => {
            const on = earned.has(b.id);
            return (
              <li key={b.id} className={`card grid place-items-center gap-1 p-3 text-center ${on ? "border-sun bg-sun/10" : "opacity-70"}`}>
                <span className={`text-4xl ${on ? "" : "grayscale"}`} aria-hidden="true">{on ? b.icon : "🔒"}</span>
                <span className="font-display font-semibold leading-tight">{b.name}</span>
                <span className="text-xs font-semibold text-muted">{on ? "পেয়েছ! 🎉" : b.description}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-4">
        <Toggle label="মজার শব্দ" description="ঠিক উত্তর আর খেলা শেষে নরম শব্দ" checked={progress.soundOn}
          onChange={(v) => updateBnProgress((p) => ({ ...p, soundOn: v }))} />
      </section>
    </>
  );
}

export function BnProgressScreen() {
  return <BanglaShell back={{ to: HUB, label: "বাংলা গণিত" }}><ProgressBody /></BanglaShell>;
}
