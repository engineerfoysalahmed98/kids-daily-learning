import type { Question, Response, ScoreResult } from "../types";
import { normalizeText } from "./util";

/** Is this response correct for this question? Never throws on bad input. */
export function checkAnswer(q: Question, r: Response | undefined | null): boolean {
  if (!r || r.type !== q.type) return false;
  switch (q.type) {
    case "mc":
      return r.type === "mc" && r.choice === q.answer;
    case "image":
      return r.type === "image" && r.choice === q.answer;
    case "tf":
      return r.type === "tf" && r.value === q.answer;
    case "type": {
      if (r.type !== "type") return false;
      const given = normalizeText(r.text);
      return q.accept.some((a) => normalizeText(a) === given);
    }
    case "order":
      return r.type === "order" && r.items.length === q.items.length && r.items.every((x, i) => x === q.items[i]);
    case "match":
      return r.type === "match" && q.pairs.every(([l, rt]) => r.pairs[l] === rt) && Object.keys(r.pairs).length === q.pairs.length;
  }
}

/** Human-readable correct answer, used in feedback and by Buddy. */
export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case "mc": return q.options[q.answer];
    case "image": return `${q.options[q.answer].emoji} ${q.options[q.answer].label}`;
    case "tf": return q.answer ? "True" : "False";
    case "type": return q.accept[0];
    case "order": return q.sentence ? q.items.join(" ") : q.items.join(" → ");
    case "match": return q.pairs.map(([l, r]) => `${l} = ${r}`).join(", ");
  }
}

export function scoreAttempt(questions: Question[], responses: Record<string, Response>): ScoreResult {
  const results = questions.map((q) => ({ questionId: q.id, correct: checkAnswer(q, responses[q.id]) }));
  const correct = results.filter((r) => r.correct).length;
  const total = questions.length;
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0, results };
}
