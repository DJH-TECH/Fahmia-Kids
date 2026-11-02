"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookCard, type CatalogProduct } from "@/components/BookCard";
import { StoreFrame } from "@/components/StoreFrame";
import { api } from "@/lib/api";
import { AGES, ageLabel } from "@/lib/labels";
import "../app/home.css";

export function BoutiqueView() {
  const params = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [message, setMessage] = useState("");
  const query = (params.get("q") || "").trim().toLowerCase();
  const [draft, setDraft] = useState(params.get("q") || "");
  const agesOn = params.getAll("age");
  const themesOn = params.getAll("theme");
  const stockOnly = params.get("stock") === "1";

  useEffect(() => {
    api<CatalogProduct[]>("/api/catalog").then(setProducts).catch((error: Error) => { setMessage(error.message); setProducts([]); });
  }, []);

  useEffect(() => {
    setDraft(params.get("q") || "");
  }, [params]);

  const catalog = products ?? [];
  const ages = AGES.filter(([value]) => catalog.some((product) => product.ageBand === value));
  const themes = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of catalog) {
      if (!product.categoryKey) continue;
      map.set(product.categoryKey, product.categoryName || product.categoryKey);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [products]);

  function write(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const search = next.toString();
    router.replace(search ? `/boutique?${search}` : "/boutique", { scroll: false });
  }

  function toggle(key: "age" | "theme", value: string) {
    write((next) => {
      const current = next.getAll(key);
      next.delete(key);
      const values = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      for (const item of values) next.append(key, item);
    });
  }

  const list = catalog.filter((product) => {
    if (agesOn.length && !agesOn.includes(product.ageBand)) return false;
    if (themesOn.length && !themesOn.includes(product.categoryKey || "")) return false;
    if (stockOnly && (product.stock ?? 0) < 1) return false;
    if (!query) return true;
    return `${product.title} ${product.author || ""} ${product.blurb} ${product.categoryName || ""}`.toLowerCase().includes(query);
  });
  const filtered = agesOn.length > 0 || themesOn.length > 0 || stockOnly || query.length > 0;

  return (
    <StoreFrame current="shop">
      <div className="wrap">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <h2>Le catalogue</h2>
            <p className="meta">{products === null ? "Chargement…" : `${list.length} produit${list.length > 1 ? "s" : ""} · prix de démonstration`}</p>
          </div>
          <form className="shop-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <input
              type="search"
              value={draft}
              placeholder="Rechercher un livre, un auteur, un thème..."
              aria-label="Filtrer le catalogue"
              onChange={(event) => {
                const value = event.target.value;
                setDraft(value);
                write((next) => {
                  const text = value.trim();
                  if (text) next.set("q", text);
                  else next.delete("q");
                });
              }}
            />
          </form>
        </div>
        {message && <p className="meta">{message}</p>}
        <div className="shop-layout">
          <aside className="filters">
            <h3>Âge</h3>
            {ages.map(([value]) => (
              <label key={value}>
                <input type="checkbox" checked={agesOn.includes(value)} onChange={() => toggle("age", value)} />
                {ageLabel(value)}
              </label>
            ))}
            <h3>Thème</h3>
            {themes.map(([key, name]) => (
              <label key={key}>
                <input type="checkbox" checked={themesOn.includes(key)} onChange={() => toggle("theme", key)} />
                {name}
              </label>
            ))}
            <h3>Disponibilité</h3>
            <label>
              <input type="checkbox" checked={stockOnly} onChange={() => write((next) => { if (stockOnly) next.delete("stock"); else next.set("stock", "1"); })} />
              En stock seulement
            </label>
            {filtered ? <button type="button" onClick={() => write((next) => { next.delete("age"); next.delete("theme"); next.delete("stock"); next.delete("q"); })}>Tout afficher</button> : null}
          </aside>
          <div>
            {products === null ? <p className="meta">Chargement du catalogue…</p> : list.length === 0 && !message ? <p className="meta">Aucun livre ne correspond. Élargissez un filtre.</p> : (
              <div className="shelf">
                {list.map((product) => <BookCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreFrame>
  );
}
