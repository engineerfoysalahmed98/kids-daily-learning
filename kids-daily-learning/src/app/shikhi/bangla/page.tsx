import type { Metadata } from "next";
import { BanglaFolderScreen } from "@/screens/hub/HubScreens";

export const metadata: Metadata = { title: "বাংলা শিখি" };

export default function Page() {
  return <BanglaFolderScreen />;
}
