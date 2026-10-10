import type { Config } from "tailwindcss";

/**
 * Kids Daily Learning design tokens.
 * Colors are CSS variables (see src/app/globals.css) so light "daytime" and
 * dark "night sky" themes share one set of utility classes.
 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./demo/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        sunken: v("sunken"),
        ink: v("ink"),
        muted: v("muted"),
        line: v("line"),
        sun: v("sun"),
        "sun-deep": v("sun-deep"),
        flame: v("flame"),
        good: v("good"),
        oops: v("oops"),
        english: v("english"),
        math: v("math"),
        science: v("science"),
        gk: v("gk"),
        story: v("story"),
        brain: v("brain"),
        creativity: v("creativity"),
        habit: v("habit"),
      },
      fontFamily: {
        // Bangla glyphs fall through the Latin fonts to Hind Siliguri.
        display: ["var(--font-display)", "Fredoka", "var(--font-bangla)", "Hind Siliguri", "Noto Sans Bengali", "ui-rounded", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Nunito", "var(--font-bangla)", "Hind Siliguri", "Noto Sans Bengali", "ui-rounded", "system-ui", "sans-serif"],
        bangla: ["var(--font-bangla)", "Hind Siliguri", "Noto Sans Bengali", "system-ui", "sans-serif"],
      },
      fontSize: {
        // kid-friendly scale: nothing interactive below 16px
        xs: ["0.8125rem", { lineHeight: "1.2rem" }],
        sm: ["0.9375rem", { lineHeight: "1.4rem" }],
        base: ["1.0625rem", { lineHeight: "1.65rem" }],
        lg: ["1.25rem", { lineHeight: "1.8rem" }],
        xl: ["1.5rem", { lineHeight: "2rem" }],
        "2xl": ["1.875rem", { lineHeight: "2.3rem" }],
        "3xl": ["2.375rem", { lineHeight: "2.7rem" }],
        "4xl": ["3rem", { lineHeight: "3.2rem" }],
      },
      borderRadius: {
        card: "1.5rem",
        blob: "2rem",
      },
      boxShadow: {
        chunky: "0 4px 0 0 rgb(var(--shadow) / 0.9)",
        "chunky-sm": "0 3px 0 0 rgb(var(--shadow) / 0.9)",
        soft: "0 10px 30px -12px rgb(var(--ink) / 0.18)",
      },
      keyframes: {
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.08)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        rise: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        wiggle: { "0%,100%": { transform: "rotate(0)" }, "25%": { transform: "rotate(-6deg)" }, "75%": { transform: "rotate(6deg)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        pop: "pop .45s cubic-bezier(.2,.9,.3,1.2) both",
        rise: "rise .35s ease-out both",
        wiggle: "wiggle .5s ease-in-out",
        floaty: "floaty 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
