import type { Metadata } from "next";
import { BnQuizScreen } from "@/screens/bangla/QuizScreen";

export const metadata: Metadata = { title: "গণিতের খেলা" };

export default function Page() {
  return <BnQuizScreen />;
}
