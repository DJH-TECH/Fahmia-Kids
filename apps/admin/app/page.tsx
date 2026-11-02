import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import "./home.css";

export const metadata: Metadata = {
  title: "Fahmia Kids — Livres islamiques pour enfants",
  description: "Librairie islamique pour enfants. Livraison au Sénégal et en Europe.",
};

export default function Page() {
  return <HomePage />;
}
