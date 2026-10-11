import type { Metadata } from "next";
import { HubQuizScreen } from "@/screens/hub/QuizScreen";

export const metadata: Metadata = { title: "কুইজ · Quiz" };

export default function Page() {
  return <HubQuizScreen />;
}
