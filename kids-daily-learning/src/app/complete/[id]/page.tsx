import type { Metadata } from "next";
import { CompleteScreen } from "@/screens/child/CompleteScreen";

export const metadata: Metadata = { title: "Well done!" };

export default function Page() {
  return <CompleteScreen />;
}
