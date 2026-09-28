import type { Metadata } from "next";
import { StoriesScreen } from "@/screens/child/ExploreScreens";

export const metadata: Metadata = { title: "Stories" };

export default function Page() {
  return <StoriesScreen />;
}
