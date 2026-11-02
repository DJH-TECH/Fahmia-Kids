"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, eur } from "@/lib/api";
import { loadSpace, rememberSpace, type SpaceSnapshot } from "@/lib/space";
import { CoverArt, coverTheme } from "@/components/CoverArt";

export type CatalogProduct = {
  id: string;
  title: string;
  blurb: string;
  author?: string;
  priceEur: number;
  priceXof: number;
  compareEur?: number | null;
  compareXof?: number | null;
  ageBand: string;
  stock?: number;
  isDemo: boolean;
  imageUrl?: string | null;
  categoryName?: string;
  categoryKey?: string;
  promoPercent?: number;
  createdAt?: string;
};

export function BookCard({ product }: { product: CatalogProduct }) {
  const reduce = useReducedMotion();
  const theme = coverTheme(product.categoryKey);
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const out = (product.stock ?? 0) < 1;

  useEffect(() => {
    loadSpace()
      .then((space) => setFavorite(space.favorites.some((item) => item.productId === product.id)))
      .catch(() => setFavorite(false));
  }, [product.id]);

  async function toggleFavorite() {
    const path = favorite ? `/api/space/favorites/${product.id}` : "/api/space/favorites";
    const next = await api<{ favorites: { productId: string }[] }>(path, favorite ? { method: "DELETE" } : { method: "POST", body: JSON.stringify({ productId: product.id }) });
    rememberSpace(next);
    setFavorite(next.favorites.some((item) => item.productId === product.id));
  }

  async function addToCart() {
    if (out) return;
    const next = await api<SpaceSnapshot>("/api/space/cart", { method: "POST", body: JSON.stringify({ productId: product.id }) });
    rememberSpace(next);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }
  return (
    <motion.article
      className="book-card"
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Link className="book-hit" href={`/boutique/${product.id}`}>
        <div className="cover" style={{ background: "#4e2348" }}>
          {product.promoPercent ? <span className="badge">Promo −{product.promoPercent} %</span> : null}
          {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <CoverArt theme={theme} />}
        </div>
        <h3>{product.title}</h3>
        <p className="stars">★★★★★ <span>démonstration</span></p>
        <p className="price">
          {product.compareEur ? <s>{eur(product.compareEur)}</s> : null}
          {eur(product.priceEur)}
        </p>
      </Link>
      <motion.button className="btn-teal" type="button" disabled={out} onClick={addToCart} whileHover={reduce || out ? undefined : { scale: 1.03 }} whileTap={reduce || out ? undefined : { scale: 0.98 }} transition={{ duration: 0.2 }}>{out ? "Rupture" : added ? "Ajouté" : "Ajouter au panier"}</motion.button>
      <button className={favorite ? "btn-fav on" : "btn-fav"} type="button" onClick={toggleFavorite}>{favorite ? "Dans les favoris" : "Mettre en favori"}</button>
    </motion.article>
  );
}
