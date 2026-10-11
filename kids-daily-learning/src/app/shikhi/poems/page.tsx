import type { Metadata } from "next";
import { PoemListScreen } from "@/screens/hub/ReadingScreens";

export const metadata: Metadata = { title: "কবিতা ও ছড়া" };

export default function Page() {
  return <PoemListScreen />;
}
