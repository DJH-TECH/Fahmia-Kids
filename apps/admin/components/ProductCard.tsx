"use client";

import { motion, useReducedMotion } from "motion/react";
import { eur } from "@/lib/api";
import { ageLabel } from "@/lib/labels";

export type CatalogProduct = {
  id: string;
  title: string;
  blurb: string;
  priceEur: number;
  ageBand: string;
  isDemo: boolean;
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-2xl border border-line bg-paper p-5 shadow-sm"
    >
      <p className="text-xs uppercase tracking-[0.08em] text-gold">{ageLabel(product.ageBand)}</p>
      <h2 className="mt-1 text-xl text-plum-hot">{product.title}</h2>
      <p className="mt-2 text-sm text-muted">{product.blurb}</p>
      <p className="mt-3 font-medium text-plum">{eur(product.priceEur)}{product.isDemo ? " · démonstration" : ""}</p>
      <button className="mt-4 rounded-xl bg-plum-hot px-5 py-3 text-sm text-white transition-colors duration-200 hover:bg-plum" type="button">
        Découvrir
      </button>
    </motion.article>
  );
}
