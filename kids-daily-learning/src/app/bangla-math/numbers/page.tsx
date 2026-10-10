import type { Metadata } from "next";
import { BnNumbersScreen } from "@/screens/bangla/NumbersScreens";

export const metadata: Metadata = { title: "সংখ্যা ১–১০০" };

export default function Page() {
  return <BnNumbersScreen />;
}
