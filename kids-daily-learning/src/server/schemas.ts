/** Request validation (zod). Rules mirror src/core/validation.ts. */
import { z } from "zod";
import { ALL_TRACKS } from "@/core/types";
import { AVATARS } from "@/core/content/meta";
import { LIMITS } from "@/core/validation";

const email = z.string().trim().toLowerCase().email("That email doesn't look right.").max(254);
const password = z.string().min(8, "Use at least 8 characters.").max(128)
  .regex(/[A-Za-z]/, "Include at least one letter.").regex(/\d/, "Include at least one number.");

export const SignUpSchema = z.object({ email, password, displayName: z.string().trim().min(1, "Enter your name.").max(40) });
export const LogInSchema = z.object({ email, password: z.string().min(1).max(128) });

const childName = z.string().trim().min(1, "Enter a first name or nickname.").max(LIMITS.nameMax)
  .regex(/^[\p{L}][\p{L}\p{M} '-]*$/u, "Use letters only — a first name or nickname is perfect.");
const age = z.number().int().min(LIMITS.minAge, "Ages 4–12 only.").max(LIMITS.maxAge, "Ages 4–12 only.");
const avatar = z.string().refine((a) => AVATARS.includes(a), "Pick one of the avatars.");

export const NewChildSchema = z.object({ name: childName, age, avatar });
export const ChildPatchSchema = z.object({
  name: childName.optional(),
  age: age.optional(),
  avatar: avatar.optional(),
  settings: z.object({
    dailyGoal: z.number().int().min(1).max(7).optional(),
    screenTimeMinutes: z.number().int().min(0).max(240).optional(),
    allowedTracks: z.array(z.enum(ALL_TRACKS as [string, ...string[]])).min(1).optional(),
    aiEnabled: z.boolean().optional(),
    soundOn: z.boolean().optional(),
    largeText: z.boolean().optional(),
  }).strict().optional(),
}).strict();

const response = z.discriminatedUnion("type", [
  z.object({ type: z.literal("mc"), choice: z.number().int().min(0).max(10) }),
  z.object({ type: z.literal("image"), choice: z.number().int().min(0).max(10) }),
  z.object({ type: z.literal("tf"), value: z.boolean() }),
  z.object({ type: z.literal("type"), text: z.string().max(60) }),
  z.object({ type: z.literal("order"), items: z.array(z.string().max(80)).max(12) }),
  z.object({ type: z.literal("match"), pairs: z.record(z.string().max(80), z.string().max(120)) }),
]);

export const CompletionSchema = z.object({
  activityId: z.string().min(3).max(120).regex(/^[a-z]\.[\w.-]+$/i, "Unknown activity."),
  input: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("quiz"), seconds: z.number().min(0).max(10800), responses: z.record(z.string().max(160), response) }),
    z.object({ kind: z.literal("done"), seconds: z.number().min(0).max(10800) }),
    z.object({ kind: z.literal("game"), seconds: z.number().min(0).max(10800), pct: z.number().min(0).max(100) }),
  ]),
});

export const UsageSchema = z.object({ seconds: z.number().int().min(-3600).max(120) });
export const BuddySchema = z.object({ childId: z.string().min(1).max(40), message: z.string().trim().min(1).max(LIMITS.buddyMax) });
export const ChildModeSchema = z.object({ childId: z.string().min(1).max(40) });
export const ExitChildModeSchema = z.object({ pin: z.string().regex(/^\d{4}$/).optional() });
export const PinSchema = z.object({ pin: z.string().regex(/^\d{4}$/, "Use exactly 4 digits.").nullable() });
export const ParentPatchSchema = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  notifications: z.object({ activity: z.boolean().optional(), badge: z.boolean().optional(), goal: z.boolean().optional() }).optional(),
}).strict();
