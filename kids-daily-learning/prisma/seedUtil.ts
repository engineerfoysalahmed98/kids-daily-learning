import type { Question } from "../src/core/types";

export function fromQuestionPlain(parentSlug: string, q: Question, sortOrder: number) {
  const { id, type, prompt, visual, explain, ...payload } = q;
  return { slug: `${parentSlug}:${id}`, type, prompt, visual: visual ?? null, explain, payload: payload as never, sortOrder };
}
