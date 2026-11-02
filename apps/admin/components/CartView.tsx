"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverArt, coverTheme } from "@/components/CoverArt";
import { StoreFrame } from "@/components/StoreFrame";
import { api, eur, xof } from "@/lib/api";
import { loadSpace, rememberSpace, type CartLine, type SpaceSnapshot } from "@/lib/space";
import "../app/home.css";

export function CartView() {
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    const read = () => {
      loadSpace()
        .then((space) => { if (alive) setLines(space.cart ?? []); })
        .catch((error: Error) => { if (alive) { setMessage(error.message); setLines([]); } });
    };
    read();
    window.addEventListener("fahmia-space", read);
    return () => {
      alive = false;
      window.removeEventListener("fahmia-space", read);
    };
  }, []);

  async function save(productId: string, qty: number) {
    const next = await api<SpaceSnapshot>(`/api/space/cart/${productId}`, { method: "PATCH", body: JSON.stringify({ qty }) });
    rememberSpace(next);
  }

  async function remove(productId: string) {
    const next = await api<SpaceSnapshot>(`/api/space/cart/${productId}`, { method: "DELETE" });
    rememberSpace(next);
  }

  const ready = lines !== null;
  const totalEur = (lines ?? []).reduce((sum, line) => sum + line.priceEur * line.qty, 0);
  const totalXof = (lines ?? []).reduce((sum, line) => sum + line.priceXof * line.qty, 0);
  const count = (lines ?? []).reduce((sum, line) => sum + line.qty, 0);

  return (
    <StoreFrame current="cart">
      <div className="wrap">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <h2>Panier</h2>
            <p className="meta">{ready ? `${count} article${count > 1 ? "s" : ""}` : "Chargement…"}</p>
          </div>
        </div>
        {message ? <p className="meta">{message}</p> : null}
        {!ready ? <p className="meta">Chargement…</p> : lines.length === 0 ? (
          <div className="bag-empty">
            <span className="bag-mark" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4e2348" strokeWidth="1.7"><path d="M6 7h15l-1.6 8H8z" /><path d="M6 7L5 4H2" /><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></svg></span>
            <h3>Le panier est vide</h3>
            <p>Les livres ajoutés depuis la boutique s’affichent ici, avec leur prix.</p>
            <Link className="btn-teal" href="/boutique">Voir la boutique</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              {lines.map((line) => (
                <article className="cart-line" key={line.id}>
                  <Link className="cover" href={`/boutique/${line.productId}`} style={{ background: "#4e2348" }}>
                    {line.imageUrl ? <img src={line.imageUrl} alt="" /> : <CoverArt theme={coverTheme(line.categoryKey)} />}
                  </Link>
                  <div>
                    <h3><Link href={`/boutique/${line.productId}`}>{line.title}</Link></h3>
                    <p className="price">
                      {line.compareEur ? <s>{eur(line.compareEur)}</s> : null}
                      {eur(line.priceEur)}
                      <small>{xof(line.priceXof)}</small>
                    </p>
                    <div className="cart-actions">
                      <div className="cart-qty">
                        <button type="button" aria-label="Diminuer" onClick={() => save(line.productId, line.qty - 1)}>−</button>
                        <span>{line.qty}</span>
                        <button type="button" aria-label="Augmenter" disabled={line.qty >= line.stock} onClick={() => save(line.productId, line.qty + 1)}>+</button>
                      </div>
                      <button className="text-link" type="button" onClick={() => remove(line.productId)}>Retirer</button>
                    </div>
                  </div>
                  <strong className="line-total">{eur(line.priceEur * line.qty)}</strong>
                </article>
              ))}
            </div>
            <aside className="cart-summary">
              <h3>Total</h3>
              <p className="price">{eur(totalEur)} <small>{xof(totalXof)}</small></p>
              <p className="meta">Livres seulement. La livraison se choisit à la commande.</p>
              <Link className="btn-teal" href="/boutique">Continuer les achats</Link>
            </aside>
          </div>
        )}
      </div>
    </StoreFrame>
  );
}
