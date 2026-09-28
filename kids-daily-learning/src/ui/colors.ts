/** Literal class maps (Tailwind needs full class names in source). */
export type Tone = "english" | "math" | "science" | "gk" | "story" | "brain" | "creativity" | "habit" | "sun";

export const TINT: Record<Tone, string> = {
  english: "bg-english/15", math: "bg-math/15", science: "bg-science/15", gk: "bg-gk/15",
  story: "bg-story/15", brain: "bg-brain/15", creativity: "bg-creativity/15", habit: "bg-habit/15", sun: "bg-sun/25",
};

export const SOLID: Record<Tone, string> = {
  english: "bg-english", math: "bg-math", science: "bg-science", gk: "bg-gk",
  story: "bg-story", brain: "bg-brain", creativity: "bg-creativity", habit: "bg-habit", sun: "bg-sun",
};

export const BORDER: Record<Tone, string> = {
  english: "border-english/40", math: "border-math/40", science: "border-science/40", gk: "border-gk/40",
  story: "border-story/40", brain: "border-brain/40", creativity: "border-creativity/40", habit: "border-habit/40", sun: "border-sun/60",
};

export const STROKE_VAR: Record<Tone, string> = {
  english: "rgb(var(--english))", math: "rgb(var(--math))", science: "rgb(var(--science))", gk: "rgb(var(--gk))",
  story: "rgb(var(--story))", brain: "rgb(var(--brain))", creativity: "rgb(var(--creativity))", habit: "rgb(var(--habit))", sun: "rgb(var(--sun))",
};

export function toneOf(color: string): Tone {
  return (color in TINT ? color : "sun") as Tone;
}
