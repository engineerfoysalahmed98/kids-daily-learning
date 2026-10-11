import type { Metadata } from "next";
import { BanglaHomeScreen } from "@/screens/bangla/HomeScreen";

export const metadata: Metadata = { title: "বাংলা সংখ্যা ও গণিত", description: "১ থেকে ১০০ পর্যন্ত বাংলা সংখ্যা, যোগ, বিয়োগ, গুণ ও ভাগ — লগইন ছাড়াই শেখো।" };

export default function Page() {
  return <BanglaHomeScreen />;
}
