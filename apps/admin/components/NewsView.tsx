"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCard, type CatalogProduct } from "@/components/BookCard";
import { CoverArt, coverTheme } from "@/components/CoverArt";
import { StoreFrame } from "@/components/StoreFrame";
import { api, eur } from "@/lib/api";
import { ageLabel } from "@/lib/labels";
import "../app/home.css";

export function NewsView() {
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);

  useEffect(() => {
    api<CatalogProduct[]>("/api/catalog")
      .then((rows) => setProducts([...rows].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") || a.title.localeCompare(b.title, "fr"))))
      .catch(() => setProducts([]));
  }, []);

  const list = products ?? [];
  const lead = list[0];
  const rest = list.slice(1);

  return (
    <StoreFrame current="news">
      <div className="wrap">
        <header className="news-hero">
          <p className="news-kicker">Arrivages</p>
          <h2><span className="plum">Les livres</span><span className="teal">qui viennent d’arriver.</span></h2>
          <p>Une sélection courte pour commencer. Les prix affichés sont des prix de démonstration.</p>
        </header>

        {products === null ? <p className="meta">Chargement…</p> : null}
        {products && list.length === 0 ? <p className="meta">Aucun livre publié pour le moment.</p> : null}

        {lead ? (
          <article className="news-feature">
            <Link className="news-cover" href={`/boutique/${lead.id}`}>
              {lead.imageUrl ? <img src={lead.imageUrl} alt="" /> : <CoverArt theme={coverTheme(lead.categoryKey)} />}
            </Link>
            <div>
              <p className="news-kicker">À la une</p>
              <h3><Link href={`/boutique/${lead.id}`}>{lead.title}</Link></h3>
              <p className="news-meta">{[lead.categoryName, ageLabel(lead.ageBand), lead.author].filter(Boolean).join(" · ")}</p>
              {lead.blurb ? <p>{lead.blurb}</p> : null}
              <p className="news-price">
                {lead.compareEur ? <s>{eur(lead.compareEur)}</s> : null}
                {eur(lead.priceEur)}
                <small>{lead.priceXof.toLocaleString("fr-FR")} XOF</small>
              </p>
              <Link className="btn" href={`/boutique/${lead.id}`}>Voir le livre</Link>
            </div>
          </article>
        ) : null}

        {rest.length ? (
          <section className="news-more">
            <h2>Le reste de la sélection</h2>
            <div className="shelf news-shelf">
              {rest.map((product) => <BookCard key={product.id} product={product} />)}
            </div>
          </section>
        ) : null}
      </div>
    </StoreFrame>
  );
}
