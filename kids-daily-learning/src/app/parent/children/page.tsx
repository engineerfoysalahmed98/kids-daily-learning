import type { Metadata } from "next";
import { ChildrenScreen } from "@/screens/parent/ManageScreens";

export const metadata: Metadata = { title: "Children" };

export default function Page() {
  return <ChildrenScreen />;
}
