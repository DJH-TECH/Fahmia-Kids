import type { Metadata } from "next";
import { FavoritesView } from "@/components/FavoritesView";

export const metadata: Metadata = {
  title: "Favoris · Fahmia Kids",
};

export default function Page() {
  return <FavoritesView />;
}
