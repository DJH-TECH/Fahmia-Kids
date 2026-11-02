import type { Metadata } from "next";
import { ContactView } from "@/components/ContactView";

export const metadata: Metadata = {
  title: "Contact · Fahmia Kids",
};

export default function Page() {
  return <ContactView />;
}
