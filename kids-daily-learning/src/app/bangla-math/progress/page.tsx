import type { Metadata } from "next";
import { BnProgressScreen } from "@/screens/bangla/ProgressScreen";

export const metadata: Metadata = { title: "আমার অগ্রগতি" };

export default function Page() {
  return <BnProgressScreen />;
}
