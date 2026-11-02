import type { Metadata } from "next";
import { Suspense } from "react";
import { BoutiqueView } from "@/components/BoutiqueView";

export const metadata: Metadata = {
  title: "Boutique · Fahmia Kids",
};

export default function Page() {
  return (
    <Suspense fallback={<p style={{ padding: 32 }}>Chargement du catalogue…</p>}>
      <BoutiqueView />
    </Suspense>
  );
}
