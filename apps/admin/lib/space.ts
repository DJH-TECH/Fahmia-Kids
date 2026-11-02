import { api } from "@/lib/api";

export type CartLine = {
  id: string;
  productId: string;
  qty: number;
  title: string;
  priceEur: number;
  priceXof: number;
  compareEur?: number | null;
  stock: number;
  categoryKey: string;
  imageUrl?: string | null;
  promoPercent?: number | null;
};

export type SpaceSnapshot = {
  favorites: { productId: string }[];
  cart?: CartLine[];
};

let request: Promise<SpaceSnapshot> | null = null;

export function loadSpace() {
  if (!request) request = api<SpaceSnapshot>("/api/space");
  return request;
}

export function rememberSpace(space: SpaceSnapshot) {
  request = Promise.resolve(space);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("fahmia-space"));
}
