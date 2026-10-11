import type { Metadata } from "next";
import { BnNumberGroupScreen } from "@/screens/bangla/NumbersScreens";

export const metadata: Metadata = { title: "সংখ্যার দল" };

export default function Page() {
  return <BnNumberGroupScreen />;
}
