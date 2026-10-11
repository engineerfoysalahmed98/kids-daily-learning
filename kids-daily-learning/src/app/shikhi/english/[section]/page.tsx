import type { Metadata } from "next";
import { EnglishSectionScreen } from "@/screens/hub/EnglishScreens";

export const metadata: Metadata = { title: "English Learning" };

export default function Page() {
  return <EnglishSectionScreen />;
}
