import type { Metadata } from "next";
import { HubHomeScreen } from "@/screens/hub/HubScreens";

export const metadata: Metadata = { title: "শিখি · Learn", description: "বাংলা, English, বাংলা গণিত, ছড়া আর গল্প — ৪ থেকে ১২ বছরের শিশুদের জন্য, লগইন ছাড়াই।" };

export default function Page() {
  return <HubHomeScreen />;
}
