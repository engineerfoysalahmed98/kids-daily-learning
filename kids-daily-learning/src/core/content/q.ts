import type {
  ImageQuestion, MatchQuestion, MultipleChoiceQuestion, OrderQuestion, TrueFalseQuestion, TypeQuestion,
} from "../types";

/** Tiny helpers so content files stay readable. */
export const mc = (id: string, prompt: string, options: string[], answer: number, explain: string, visual?: string): MultipleChoiceQuestion =>
  ({ id, type: "mc", prompt, options, answer, explain, visual });

export const tf = (id: string, prompt: string, answer: boolean, explain: string, visual?: string): TrueFalseQuestion =>
  ({ id, type: "tf", prompt, answer, explain, visual });

export const img = (id: string, prompt: string, options: [string, string][], answer: number, explain: string): ImageQuestion =>
  ({ id, type: "image", prompt, options: options.map(([emoji, label]) => ({ emoji, label })), answer, explain });

export const match = (id: string, prompt: string, pairs: [string, string][], explain: string): MatchQuestion =>
  ({ id, type: "match", prompt, pairs, explain });

export const typed = (id: string, prompt: string, accept: string[], explain: string, inputMode: "numeric" | "text" = "text", visual?: string): TypeQuestion =>
  ({ id, type: "type", prompt, accept, explain, inputMode, visual });

export const order = (id: string, prompt: string, items: string[], explain: string, sentence = false): OrderQuestion =>
  ({ id, type: "order", prompt, items, explain, sentence });
