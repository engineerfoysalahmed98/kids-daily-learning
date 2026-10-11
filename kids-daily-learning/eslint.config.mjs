// ESLint flat config (ESLint 9). Replaces the deprecated `next lint` runner
// while keeping exactly the same rule sets as the old .eslintrc.json:
// next/core-web-vitals + next/typescript, loaded through FlatCompat.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "demo/dist/**", "next-env.d.ts"] },
];

export default eslintConfig;
