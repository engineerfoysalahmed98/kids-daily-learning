import type { Metadata } from "next";
import { PoemScreen } from "@/screens/hub/ReadingScreens";

export const metadata: Metadata = { title: "কবিতা ও ছড়া" };

export default function Page() {
  return <PoemScreen />;
}
