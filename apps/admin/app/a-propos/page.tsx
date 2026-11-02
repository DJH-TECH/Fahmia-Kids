import type { Metadata } from "next";
import { AboutView } from "@/components/AboutView";

export const metadata: Metadata = {
  title: "À propos · Fahmia Kids",
};

export default function Page() {
  return <AboutView />;
}
