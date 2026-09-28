import type { Metadata } from "next";
import { QuizScreen } from "@/screens/child/ActivityScreens";

export const metadata: Metadata = { title: "Quiz" };

export default function Page() {
  return <QuizScreen />;
}
