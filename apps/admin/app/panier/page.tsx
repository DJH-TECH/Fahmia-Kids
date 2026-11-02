import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Panier · Fahmia Kids",
};

export default function Page() {
  return <CartView />;
}
