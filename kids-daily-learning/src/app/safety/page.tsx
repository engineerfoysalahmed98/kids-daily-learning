import type { Metadata } from "next";
import { SafetyScreen } from "@/screens/public/SafetyScreen";

export const metadata: Metadata = { title: "Privacy & Safety" };

export default function Page() {
  return <SafetyScreen />;
}
