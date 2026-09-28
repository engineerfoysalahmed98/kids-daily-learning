import type { NextRequest } from "next/server";
import { body, HttpError, json, requireChild, route } from "@/server/http";
import { BuddySchema } from "@/server/schemas";
import { hit, LIMITS } from "@/server/rateLimit";
import { askBuddy } from "@/server/buddy";
import { loadContent } from "@/server/content";
import { db } from "@/server/db";

export const POST = route(async (req: NextRequest) => {
  const { childId, message } = await body(req, BuddySchema);
  const { child } = await requireChild(childId, { childSelfOk: true });
  if (child.settings && !child.settings.aiEnabled) throw new HttpError(403, "Buddy is switched off by your grown-up.");

  const burst = hit(`buddy:${child.id}`, LIMITS.buddyBurst);
  const daily = burst.ok ? hit(`buddy-day:${child.id}`, LIMITS.buddyDaily) : burst;
  if (!burst.ok || !daily.ok) {
    return json({ text: "Buddy needs a little rest! Let's try again in a few minutes. Meanwhile, why not finish an activity? 🌟", blocked: true, remaining: 0 });
  }

  const content = await loadContent();
  const reply = await askBuddy(message, { name: child.name, age: child.age, vocab: content.vocab });
  if (reply.flag) {
    // Safety alert to the parent — the child's words are NOT stored.
    await db.notification.create({ data: { parentId: child.parentId, childId: child.id, kind: "safety", text: `${child.name} told Buddy something that suggests they may be upset. You may want to check in with them. 💛` } });
  }
  const { flag: _flag, ...safe } = reply;
  void _flag;
  return json({ ...safe, remaining: burst.remaining });
});
