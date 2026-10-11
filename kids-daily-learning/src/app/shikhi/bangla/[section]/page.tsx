import type { Metadata } from "next";
import { BanglaSectionScreen } from "@/screens/hub/BanglaScreens";

export const metadata: Metadata = { title: "বাংলা শিখি" };

export default function Page() {
  return <BanglaSectionScreen />;
}
