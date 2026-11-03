"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookCard, type CatalogProduct } from "@/components/BookCard";
import { StoreFrame } from "@/components/StoreFrame";
import { api } from "@/lib/api";
import { AGES, ageLabel } from "@/lib/labels";
import "../app/home.css";

const PRICE_BANDS = [
  ["0-10", "0 – 10 €", 0, 10],
  ["10-20", "10 – 20 €", 10, 20],
  ["20-30", "20 – 30 €", 20, 30],
  ["30+", "30 € et plus", 30, Infinity],
] as const;

export function BoutiqueView() {
  const params = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const query = (params.get("q") || "").trim().toLowerCase();
  const agesOn = params.getAll("age");
  const themesOn = params.getAll("theme");
  const pricesOn = params.getAll("prix");
  const stockOnly = params.get("stock") === "1";
  const sort = params.get("tri") || "pertinence";

  useEffect(() => {
    api<CatalogProduct[]>("/api/catalog").then(setProducts).catch((error: Error) => { setMessage(error.message); setProducts([]); });
  }, []);

  const catalog = products ?? [];
  const ages = AGES.filter(([value]) => catalog.some((product) => product.ageBand === value));
  const themes = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of catalog) {
      if (!product.categoryKey) continue;
      map.set(product.categoryKey, product.categoryName || product.categoryKey);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [catalog]);

  function write(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const search = next.toString();
    router.replace(search ? `/boutique?${search}` : "/boutique", { scroll: false });
  }

  function toggle(key: "age" | "theme" | "prix", value: string) {
    write((next) => {
      const current = next.getAll(key);
      next.delete(key);
      const values = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      for (const item of values) next.append(key, item);
    });
  }

  function inPrice(product: CatalogProduct, band: string) {
    const row = PRICE_BANDS.find(([key]) => key === band);
    if (!row) return false;
    const price = product.priceEur;
    return price >= row[2] && price < row[3];
  }

  const list = useMemo(() => {
    const rows = catalog.filter((product) => {
      if (agesOn.length && !agesOn.includes(product.ageBand)) return false;
      if (themesOn.length && !themesOn.includes(product.categoryKey || "")) return false;
      if (pricesOn.length && !pricesOn.some((band) => inPrice(product, band))) return false;
      if (stockOnly && (product.stock ?? 0) < 1) return false;
      if (!query) return true;
      return `${product.title} ${product.author || ""} ${product.blurb} ${product.categoryName || ""}`.toLowerCase().includes(query);
    });
    const copy = [...rows];
    if (sort === "prix-asc") copy.sort((a, b) => a.priceEur - b.priceEur || a.title.localeCompare(b.title, "fr"));
    else if (sort === "prix-desc") copy.sort((a, b) => b.priceEur - a.priceEur || a.title.localeCompare(b.title, "fr"));
    else copy.sort((a, b) => a.title.localeCompare(b.title, "fr"));
    return copy;
  }, [catalog, agesOn, themesOn, pricesOn, stockOnly, query, sort]);

  const count = (match: (product: CatalogProduct) => boolean) => catalog.filter(match).length;

  return (
    <StoreFrame current="shop">
      <div className="wrap shop-page">
        <section className="shop-hero">
          <div className="shop-hero-copy">
            <h1>Notre Boutique</h1>
            <p>Découvrez notre sélection de livres pour accompagner vos enfants dans leur apprentissage.</p>
            <a className="btn" href="#catalogue">Explorer la boutique →</a>
          </div>
          <div className="shop-hero-photo">
            <img src="/banner-enfants.png" alt="Deux enfants lisent un livre illustré" />
          </div>
        </section>

        <div className="shop-layout" id="catalogue">
          <aside>
            <div className="filters">
              <div className="filters-head">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                Filtrer par
              </div>
              <details open>
                <summary>Catégorie</summary>
                {themes.map(([key, name]) => (
                  <label key={key}>
                    <input type="checkbox" checked={themesOn.includes(key)} onChange={() => toggle("theme", key)} />
                    <span>{name}</span>
                    <b>{count((product) => product.categoryKey === key)}</b>
                  </label>
                ))}
              </details>
              <details open>
                <summary>Âge recommandé</summary>
                {ages.map(([value]) => (
                  <label key={value}>
                    <input type="checkbox" checked={agesOn.includes(value)} onChange={() => toggle("age", value)} />
                    <span>{ageLabel(value)}</span>
                    <b>{count((product) => product.ageBand === value)}</b>
                  </label>
                ))}
              </details>
              <details open>
                <summary>Prix</summary>
                {PRICE_BANDS.filter(([key, , min, max]) => pricesOn.includes(key) || catalog.some((product) => product.priceEur >= min && product.priceEur < max)).map(([key, label, min, max]) => (
                  <label key={key}>
                    <input type="checkbox" checked={pricesOn.includes(key)} onChange={() => toggle("prix", key)} />
                    <span>{label}</span>
                    <b>{count((product) => product.priceEur >= min && product.priceEur < max)}</b>
                  </label>
                ))}
              </details>
              <label className="stock-line">
                <input type="checkbox" checked={stockOnly} onChange={() => write((next) => { if (stockOnly) next.delete("stock"); else next.set("stock", "1"); })} />
                <span>En stock seulement</span>
              </label>
              <button type="button" onClick={() => router.replace("/boutique", { scroll: false })}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.2-5.5" /><path d="M20 4v5h-5" /></svg>
                Réinitialiser
              </button>
            </div>
            <div className="ship-note">
              <span aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a07d3a" strokeWidth="1.6"><path d="M4 10h10v8H4z" /><path d="M14 13h3l3 3v2h-6z" /><circle cx="8" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></svg>
              </span>
              <p><strong>Livraison rapide</strong>Partout au Sénégal et en Europe</p>
            </div>
          </aside>
          <div>
            <div className="shop-bar">
              <div className="view-toggle" role="group" aria-label="Mode d’affichage">
                <button type="button" aria-label="Grille" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" /></svg>
                </button>
                <button type="button" aria-label="Liste" aria-pressed={view === "list"} onClick={() => setView("list")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
                </button>
              </div>
              <p className="meta">{products === null ? "Chargement…" : `${list.length} produit${list.length > 1 ? "s" : ""} trouvé${list.length > 1 ? "s" : ""}`}<span>Prix de démonstration</span></p>
              <label className="sort">
                Trier par
                <select value={sort} aria-label="Trier par" onChange={(event) => write((next) => { const value = event.target.value; if (value === "pertinence") next.delete("tri"); else next.set("tri", value); })}>
                  <option value="pertinence">Pertinence</option>
                  <option value="prix-asc">Prix croissant</option>
                  <option value="prix-desc">Prix décroissant</option>
                </select>
              </label>
            </div>
            {message && <p className="meta">{message}</p>}
            {products === null ? <p className="meta">Chargement du catalogue…</p> : list.length === 0 && !message ? <p className="meta">Aucun livre ne correspond. Élargissez un filtre.</p> : (
              <div className={view === "list" ? "shelf shop-shelf is-list" : "shelf shop-shelf"}>
                {list.map((product) => <BookCard key={product.id} product={product} variant="shop" />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreFrame>
  );
}
