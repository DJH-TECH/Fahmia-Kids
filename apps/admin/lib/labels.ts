export const TYPES = [
  ["BOOK", "Livre"],
  ["ACTIVITY", "Activité"],
  ["GAME", "Jeu"],
  ["PACK", "Pack"],
  ["GIFT_BOX", "Coffret"],
] as const;

export const AGES = [
  ["3-5", "3–5 ans"],
  ["6-8", "6–8 ans"],
  ["9-12", "9–12 ans"],
] as const;

export function typeLabel(code: string) {
  return TYPES.find(([value]) => value === code)?.[1] || code;
}

export function ageLabel(code: string) {
  return AGES.find(([value]) => value === code)?.[1] || code;
}

export function statusLabel(status: string) {
  if (status === "published") return "Publié";
  if (status === "draft") return "Brouillon";
  if (status === "a_preparer") return "À préparer";
  if (status === "expediee") return "Expédiée";
  if (status === "livree") return "Livrée";
  if (status === "pending") return "À relire";
  if (status === "hidden") return "Masqué";
  return status;
}
