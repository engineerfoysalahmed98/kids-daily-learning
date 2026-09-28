import type { Metadata } from "next";
import { CreateScreen } from "@/screens/child/ActivityScreens";

export const metadata: Metadata = { title: "Create" };

export default function Page() {
  return <CreateScreen />;
}
