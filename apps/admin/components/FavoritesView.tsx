"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCard, type CatalogProduct } from "@/components/BookCard";
import { StoreFrame } from "@/components/StoreFrame";
import { api } from "@/lib/api";
import { loadSpace } from "@/lib/space";
import "../app/home.css";

export function FavoritesView() {
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [ids, setIds] = useState<string[] | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    const read = () => {
      loadSpace()
        .then((space) => { if (alive) setIds(space.favorites.map((item) => item.productId)); })
        .catch((error: Error) => { if (alive) { setMessage(error.message); setIds([]); } });
    };
    read();
    api<CatalogProduct[]>("/api/catalog").then((rows) => { if (alive) setProducts(rows); }).catch((error: Error) => { if (alive) setMessage(error.message); });
    window.addEventListener("fahmia-space", read);
    return () => {
      alive = false;
      window.removeEventListener("fahmia-space", read);
    };
  }, []);

  const list = (products ?? []).filter((product) => ids?.includes(product.id));
  const ready = products !== null && ids !== null;

  return (
    <StoreFrame current="favorites">
      <div className="wrap">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <h2>Favoris</h2>
            <p className="meta">{ready ? `${list.length} livre${list.length > 1 ? "s" : ""} mis de côté` : "Chargement…"}</p>
          </div>
        </div>
        {message ? <p className="meta">{message}</p> : null}
        {!ready ? <p className="meta">Chargement…</p> : list.length === 0 ? (
          <div className="bag-empty">
            <span className="bag-mark" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4e2348" strokeWidth="1.7"><path d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" /></svg></span>
            <h3>Aucun livre mis de côté</h3>
            <p>Le cœur sur une couverture de la boutique ajoute le livre ici.</p>
            <Link className="btn-teal" href="/boutique">Voir la boutique</Link>
          </div>
        ) : (
          <div className="fav-shelf">
            {list.map((product) => <BookCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </StoreFrame>
  );
}
