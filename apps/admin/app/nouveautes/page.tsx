import type { Metadata } from "next";
import { NewsView } from "@/components/NewsView";

export const metadata: Metadata = {
  title: "Nouveautés · Fahmia Kids",
};

export default function Page() {
  return <NewsView />;
}
