#!/usr/bin/env node
/**
 * Builds the playable demo into ONE self-contained HTML file:
 *   demo/dist/kids-daily-learning-demo.html
 *
 * Same screens as the Next.js app, wired to the in-browser MockDataService.
 * Usage:  npm run demo:build     (needs esbuild + tailwindcss dev deps)
 *    or:  bun scripts/build-demo.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "demo/dist");
mkdirSync(out, { recursive: true });

// 1) JavaScript bundle
const entry = join(root, "demo/main.tsx");
const jsFile = join(out, "app.js");
if (typeof globalThis.Bun !== "undefined") {
  const r = await globalThis.Bun.build({
    entrypoints: [entry], minify: true, target: "browser", format: "iife",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  if (!r.success) { console.error(r.logs); process.exit(1); }
  writeFileSync(jsFile, await r.outputs[0].text());
} else {
  const esbuild = await import("esbuild");
  await esbuild.build({
    entryPoints: [entry], bundle: true, minify: true, format: "iife", outfile: jsFile, jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' }, alias: { "@": join(root, "src") },
  });
}

// 2) Tailwind CSS (TAILWIND_BIN lets you use the standalone CLI)
const cssFile = join(out, "app.css");
const bin = process.env.TAILWIND_BIN ?? (existsSync(join(root, "node_modules/.bin/tailwindcss")) ? join(root, "node_modules/.bin/tailwindcss") : "tailwindcss");
execFileSync(bin, ["-c", join(root, "tailwind.config.ts"), "-i", join(root, "src/app/globals.css"), "-o", cssFile, "--minify"], { stdio: "inherit", cwd: root });

// 3) Inline everything into one HTML file
const js = readFileSync(jsFile, "utf8").replace(/<\/script/gi, "<\\/script");
const css = readFileSync(cssFile, "utf8");
const html = `<meta charset="utf-8">
<title>Kids Daily Learning</title>
<meta name="description" content="Playable demo of Kids Daily Learning — daily lessons, quizzes, stories, games and good habits for ages 4–12.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@500;600;700;800&display=swap">
<style>:root{--font-display:"Fredoka";--font-body:"Nunito"}${css}</style>
<div id="root"></div>
<noscript>Kids Daily Learning needs JavaScript to run.</noscript>
<script>${js}</script>
`;
const target = join(out, "kids-daily-learning-demo.html");
writeFileSync(target, html);
console.log(`Demo written to ${target} (${Math.round(html.length / 1024)} KB)`);
