import "server-only";
import { buddySystemPrompt, checkBuddyReply, checkChildMessage } from "@/core/buddy/safety";
import { mockBuddyReply, type BuddyReply } from "@/core/buddy/mockBuddy";
import type { VocabWord } from "@/core/types";

/**
 * Buddy provider.
 *   BUDDY_PROVIDER=mock       deterministic offline replies (default)
 *   BUDDY_PROVIDER=anthropic  Claude via the Messages API (ANTHROPIC_API_KEY, BUDDY_MODEL)
 *
 * Pipeline: input safety check → model → output safety check → reply.
 * Nothing the child types is stored; only a counter is kept for rate limits.
 */
export async function askBuddy(message: string, ctx: { name: string; age: number; vocab: VocabWord[] }): Promise<BuddyReply & { blocked?: boolean; flag?: string }> {
  const verdict = checkChildMessage(message);
  if (!verdict.ok) return { text: verdict.reply, blocked: true, flag: verdict.notifyParent ? verdict.category : undefined };

  if (process.env.BUDDY_PROVIDER !== "anthropic" || !process.env.ANTHROPIC_API_KEY) {
    return mockBuddyReply(message, ctx);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.BUDDY_MODEL ?? "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: buddySystemPrompt(ctx.age),
        // No name or other identifiers are sent to the model.
        messages: [{ role: "user", content: message }],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Model error ${res.status}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    if (!text) throw new Error("Empty reply");
    const out = checkBuddyReply(text);
    return out.ok ? { text } : { text: out.reply, blocked: true };
  } catch (e) {
    console.warn("[buddy] falling back to mock:", (e as Error).message);
    return mockBuddyReply(message, ctx);
  }
}
