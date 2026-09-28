/**
 * Shared input rules. The server enforces the same rules with zod
 * (src/server/schemas.ts) — the client uses these for instant feedback.
 */

export const LIMITS = { minAge: 4, maxAge: 12, nameMax: 20, maxChildren: 6, passwordMin: 8, buddyMax: 300 } as const;

export type Check = string | null; // error message or null

export function checkEmail(email: string): Check {
  const e = email.trim();
  if (!e) return "Enter your email address.";
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return "That email doesn't look right. Check for typos.";
  return null;
}

export function checkPassword(pw: string): Check {
  if (pw.length < LIMITS.passwordMin) return `Use at least ${LIMITS.passwordMin} characters.`;
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Include at least one letter and one number.";
  if (pw.length > 128) return "Use 128 characters or fewer.";
  return null;
}

export function checkDisplayName(name: string): Check {
  const n = name.trim();
  if (!n) return "Enter your name.";
  if (n.length > 40) return "Use 40 characters or fewer.";
  return null;
}

/** Child names: first name or nickname only. */
export function checkChildName(name: string): Check {
  const n = name.trim();
  if (!n) return "Enter a first name or nickname.";
  if (n.length > LIMITS.nameMax) return `Use ${LIMITS.nameMax} characters or fewer.`;
  if (!/^[\p{L}][\p{L}\p{M} '-]*$/u.test(n)) return "Use letters only — a first name or nickname is perfect.";
  if (n.split(/\s+/).length > 2) return "Just a first name or nickname, please — no surname needed.";
  return null;
}

export function checkAge(age: number): Check {
  if (!Number.isInteger(age) || age < LIMITS.minAge || age > LIMITS.maxAge) return `Kids Daily Learning is for ages ${LIMITS.minAge}–${LIMITS.maxAge}.`;
  return null;
}

export function checkPin(pin: string): Check {
  return /^\d{4}$/.test(pin) ? null : "Use exactly 4 digits.";
}

export function cleanText(s: string, max: number): string {
  return s.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
