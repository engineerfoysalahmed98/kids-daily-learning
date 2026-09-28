"use client";
import { useEffect, useRef, useState } from "react";
import type { Activity, Response } from "@/core/types";
import { checkAnswer, correctAnswerText } from "@/core/engine";
import { ProgressBar, Modal } from "../primitives";
import { QuestionView } from "./QuestionView";
import { playSfx } from "../effects";

const PRAISE = ["Great job! 🎉", "Great job! 🎉", "You got it! ⭐", "Brilliant! 🌟", "Super smart! 🧠"];

/**
 * Runs a quiz one question at a time with instant, kind feedback.
 * Never shames: wrong answers get "Almost! Let's learn this together."
 */
export function QuizRunner({ activity, soundOn, onFinish, onExit, submitting }: {
  activity: Activity;
  soundOn: boolean;
  onFinish: (responses: Record<string, Response>, seconds: number) => void;
  onExit: () => void;
  submitting: boolean;
}) {
  const qs = activity.questions ?? [];
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [answered, setAnswered] = useState<{ response: Response; correct: boolean } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const started = useRef(Date.now());
  const feedbackRef = useRef<HTMLDivElement>(null);
  const q = qs[index];

  useEffect(() => { if (answered) feedbackRef.current?.focus({ preventScroll: false }); }, [answered]);

  if (!q) return null;

  function answer(r: Response) {
    if (answered) return;
    const correct = checkAnswer(q, r);
    setAnswered({ response: r, correct });
    setResponses((prev) => ({ ...prev, [q.id]: r }));
    if (correct) setCorrectCount((c) => c + 1);
    playSfx(correct ? "correct" : "gentle", soundOn);
  }

  function next() {
    if (index + 1 >= qs.length) {
      onFinish(responses, Math.round((Date.now() - started.current) / 1000));
      return;
    }
    setAnswered(null);
    setIndex(index + 1);
    window.scrollTo({ top: 0 });
  }

  const isLast = index + 1 >= qs.length;

  return (
    <div className="mx-auto grid max-w-2xl gap-5 pb-40">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setConfirmExit(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sunken text-xl" aria-label="Leave quiz">✕</button>
        <div className="flex-1"><ProgressBar value={index + (answered ? 1 : 0)} max={qs.length} label={`Question ${index + 1} of ${qs.length}`} tone="science" /></div>
        <span className="chip tnum shrink-0 bg-sun/25" aria-label={`${correctCount} correct so far`}>⭐ {correctCount}</span>
      </div>
      <p className="label">{activity.icon} {activity.title} · Question {index + 1} of {qs.length}</p>

      <div className="card p-5 sm:p-7" key={q.id}>
        <QuestionView q={q} answered={answered} onAnswer={answer} />
      </div>

      {answered && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-rise pb-[env(safe-area-inset-bottom,0px)]">
          <div ref={feedbackRef} tabIndex={-1} role="status" aria-live="assertive"
            className={`mx-auto max-w-2xl rounded-t-[1.75rem] border-2 border-b-0 px-5 pb-5 pt-4 shadow-soft outline-none ${answered.correct ? "border-good/40 bg-[rgb(var(--surface))]" : "border-oops/40 bg-[rgb(var(--surface))]"}`}>
            <div className="flex items-start gap-3">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${answered.correct ? "bg-good/15" : "bg-oops/15"}`} aria-hidden="true">{answered.correct ? "🎉" : "💡"}</span>
              <div className="min-w-0 flex-1">
                <p className={`font-display text-xl font-semibold ${answered.correct ? "text-good" : "text-oops"}`}>
                  {answered.correct ? PRAISE[index % PRAISE.length] : "Almost! Let's learn this together."}
                </p>
                {!answered.correct && <p className="mt-1 font-bold">The answer is: <span className="text-ink">{correctAnswerText(q)}</span></p>}
                <p className="mt-1 text-muted">{q.explain}</p>
              </div>
            </div>
            <button type="button" className="btn-primary mt-4 w-full" onClick={next} disabled={submitting}>
              {isLast ? (submitting ? "Saving…" : "See my stars ⭐") : "Next question →"}
            </button>
          </div>
        </div>
      )}

      <Modal open={confirmExit} onClose={() => setConfirmExit(false)} title="Take a break?">
        <p className="text-muted">Your answers for this quiz won't be saved, but you can start again any time.</p>
        <div className="mt-5 flex gap-3">
          <button className="btn-secondary flex-1" onClick={onExit}>Leave</button>
          <button className="btn-primary flex-1" onClick={() => setConfirmExit(false)}>Keep going</button>
        </div>
      </Modal>
    </div>
  );
}
