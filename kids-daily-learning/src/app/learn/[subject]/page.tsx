import type { Metadata } from "next";
import { SubjectScreen } from "@/screens/child/LearnScreens";

export const metadata: Metadata = { title: "Subject" };

export default function Page() {
  return <SubjectScreen />;
}
