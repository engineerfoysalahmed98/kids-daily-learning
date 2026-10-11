import type { Metadata } from "next";
import { EnglishFolderScreen } from "@/screens/hub/HubScreens";

export const metadata: Metadata = { title: "English Learning" };

export default function Page() {
  return <EnglishFolderScreen />;
}
