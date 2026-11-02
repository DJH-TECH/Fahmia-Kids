import type { Metadata } from "next";
import { ProductView } from "@/components/ProductView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`http://127.0.0.1:4000/api/catalog/${id}`, { cache: "no-store" });
    if (!res.ok) return { title: "Livre introuvable · Fahmia Kids" };
    const product = await res.json() as { title?: string };
    return { title: `${product.title || "Livre"} · Fahmia Kids` };
  } catch {
    return { title: "Livre · Fahmia Kids" };
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductView id={id} />;
}
