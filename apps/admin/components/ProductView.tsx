"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCard, type CatalogProduct } from "@/components/BookCard";
import { CoverArt, coverTheme } from "@/components/CoverArt";
import { StoreFrame } from "@/components/StoreFrame";
import { api, eur, xof } from "@/lib/api";
import { loadSpace, rememberSpace, type SpaceSnapshot } from "@/lib/space";
import { ageLabel } from "@/lib/labels";
import "../app/home.css";

type Review = { id: string; authorName: string; body: string; rating: number; isDemo: boolean };
type ProductDetail = CatalogProduct & {
  description?: string;
  advice?: string;
  type?: string;
  reviews: Review[];
  related: CatalogProduct[];
};

const tabs = [
  ["description", "Description"],
  ["reviews", "Avis"],
  ["ship", "Livraison et retour"],
  ["faq", "Questions fréquentes"],
] as const;

export function ProductView({ id }: { id: string }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [message, setMessage] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("description");

  useEffect(() => {
    setProduct(null);
    setMessage("");
    setAdded(false);
    setQty(1);
    setTab("description");
    api<ProductDetail>(`/api/catalog/${id}`).then(setProduct).catch((error: Error) => setMessage(error.message));
    loadSpace()
      .then((space) => setFavorite(space.favorites.some((item) => item.productId === id)))
      .catch(() => setFavorite(false));
  }, [id]);

  async function toggleFavorite() {
    const path = favorite ? `/api/space/favorites/${id}` : "/api/space/favorites";
    const next = await api<SpaceSnapshot>(path, favorite ? { method: "DELETE" } : { method: "POST", body: JSON.stringify({ productId: id }) });
    rememberSpace(next);
    setFavorite(next.favorites.some((item) => item.productId === id));
  }

  async function addToCart() {
    if (!product || (product.stock ?? 0) < 1) return;
    let next = await api<SpaceSnapshot>("/api/space/cart", { method: "POST", body: JSON.stringify({ productId: id }) });
    if (qty > 1) {
      const line = (next.cart ?? []).find((item) => item.productId === id);
      const target = Math.min(product.stock ?? qty, (line?.qty ?? 1) - 1 + qty);
      next = await api<SpaceSnapshot>(`/api/space/cart/${id}`, { method: "PATCH", body: JSON.stringify({ qty: target }) });
    }
    rememberSpace(next);
    setAdded(true);
  }

  const stock = product?.stock ?? 0;
  const cover = product ? (product.imageUrl ? <img src={product.imageUrl} alt="" /> : <CoverArt theme={coverTheme(product.categoryKey)} />) : null;
  const points = product ? [ageLabel(product.ageBand), product.categoryName, product.advice].filter((line): line is string => Boolean(line)) : [];
  const demoReviews = product ? product.reviews.length > 0 && product.reviews.every((review) => review.isDemo) : false;
  const quote = product?.reviews[0];

  return (
    <StoreFrame current="shop">
      <div className="wrap fiche">
        <p className="crumb">
          <Link href="/" aria-label="Accueil">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5" /><path d="M7 10.5V20h10v-9.5" /></svg>
          </Link>
          <Link href="/boutique">Boutique</Link>
          {product ? <span>{product.title}</span> : null}
        </p>
        {message ? <p className="meta">{message}</p> : null}
        {!product && !message ? <p className="meta">Chargement…</p> : null}
        {product ? (
          <>
            <div className="fiche-top">
              <div className="fiche-gallery">
                <div className="fiche-thumbs">
                  <div className="fiche-thumb" aria-hidden="true">{cover}</div>
                </div>
                <div className="fiche-stage">
                  {product.promoPercent ? <span className="badge">Promo −{product.promoPercent} %</span> : null}
                  {cover}
                </div>
              </div>
              <div className="fiche-buy">
                <p className="stars">★★★★★ <span>{product.reviews.length > 0 ? `${product.reviews.length} avis${demoReviews ? " de démonstration" : ""}` : "démonstration"}</span></p>
                <h1>{product.title}</h1>
                <p className="lede">{product.blurb}</p>
                {points.length > 0 ? (
                  <ul className="fiche-points">
                    {points.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                ) : null}
                <p className="price">
                  {eur(product.priceEur)}
                  {product.compareEur ? <s>{eur(product.compareEur)}</s> : null}
                  {product.promoPercent ? <em>−{product.promoPercent} %</em> : null}
                  <small>{xof(product.priceXof)} · prix de démonstration</small>
                </p>
                <p className="fiche-stock">
                  <span>{stock < 1 ? "Rupture" : "En stock"}</span>
                  Livraison au Sénégal et en Europe
                </p>
                <div className="fiche-actions">
                  <div className="fiche-qty">
                    <button type="button" aria-label="Diminuer" disabled={qty <= 1} onClick={() => setQty((value) => Math.max(1, value - 1))}>−</button>
                    <span>{qty}</span>
                    <button type="button" aria-label="Augmenter" disabled={qty >= Math.max(stock, 1)} onClick={() => setQty((value) => Math.min(stock, value + 1))}>+</button>
                  </div>
                  <button className="btn-teal" type="button" disabled={stock < 1} onClick={addToCart}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 7h15l-1.6 8H8z" /><path d="M6 7 5 4H2" /><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></svg>
                    {stock < 1 ? "Rupture" : added ? "Ajouté" : "Ajouter au panier"}
                  </button>
                  <button className={favorite ? "btn-fav on" : "btn-fav"} type="button" onClick={toggleFavorite}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" /></svg>
                    {favorite ? "Dans les favoris" : "Ajouter aux favoris"}
                  </button>
                </div>
              </div>
              <aside className="fiche-side">
                <ul>
                  <li>
                    <i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><path d="M3 8h11v8H3z" /><path d="M14 11h4l3 3v2h-7" /><circle cx="7" cy="17.5" r="1.3" /><circle cx="17" cy="17.5" r="1.3" /></svg></i>
                    <span><strong>Livraison rapide</strong>au Sénégal et en Europe</span>
                  </li>
                  <li>
                    <i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><path d="M12 3.2 19.2 6v5.6c0 4.6-3 7.5-7.2 8.6-4.2-1.1-7.2-4-7.2-8.6V6z" /><path d="m9 11.6 2 2 4-4.2" /></svg></i>
                    <span><strong>Paiement sécurisé</strong>Vos informations sont protégées.</span>
                  </li>
                  <li>
                    <i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg></i>
                    <span><strong>Service client</strong><a href="tel:+221771234567">+221 77 123 45 67</a></span>
                  </li>
                  <li>
                    <i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><path d="M4 12a8 8 0 1 0 2.2-5.5" /><path d="M4 5v5h5" /></svg></i>
                    <span><strong>Retour sous 14 jours</strong>Selon les conditions.</span>
                  </li>
                </ul>
                <Link className="fiche-gift" href="/#coffrets">
                  <i aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a07d3a" strokeWidth="1.6"><rect x="3" y="10" width="18" height="10" rx="1.5" /><path d="M3 14h18M12 10v10" /><path d="M12 10c-2-4-6-4-6-1.5S10 10 12 10c2-4 6-4 6-1.5S14 10 12 10z" /></svg></i>
                  <span><strong>Offrez la foi et le savoir</strong>Voir les coffrets</span>
                </Link>
              </aside>
            </div>

            <section className="fiche-sheet">
              <div className="fiche-tabbar" role="tablist">
                {tabs.map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
                    {label}{key === "reviews" && product.reviews.length > 0 ? ` (${product.reviews.length})` : ""}
                  </button>
                ))}
              </div>
              {tab === "description" ? (
                <div className="fiche-panel">
                  <div>
                    <h2>Le livre</h2>
                    <p className="description">{product.description || product.blurb}</p>
                  </div>
                  <ul className="fiche-checks">
                    {points.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                  {quote ? (
                    <blockquote>
                      <p>{quote.body}</p>
                      <span>{quote.authorName}{quote.isDemo ? " · démonstration" : ""}</span>
                    </blockquote>
                  ) : null}
                </div>
              ) : null}
              {tab === "reviews" ? (
                <div className="fiche-panel is-plain">
                  {product.reviews.length === 0 ? <p className="meta">Aucun avis publié. Le gérant décide ce qui apparaît.</p> : product.reviews.map((review) => (
                    <article className="review" key={review.id}>
                      <p className="stars">{"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))} <span>{review.authorName}{review.isDemo ? " · démonstration" : ""}</span></p>
                      <p>{review.body}</p>
                    </article>
                  ))}
                </div>
              ) : null}
              {tab === "ship" ? (
                <div className="fiche-panel is-plain">
                  <div>
                    <h2>Livraison</h2>
                    <p>Les colis partent au Sénégal et en Europe. Les frais se choisissent au moment de la commande. Cette fiche ne prend pas le paiement.</p>
                    <p>Retour sous 14 jours, selon les conditions. Nous ne publions pas d’adresse de boutique.</p>
                  </div>
                </div>
              ) : null}
              {tab === "faq" ? (
                <div className="fiche-faq">
                  <details open>
                    <summary>Où livrez-vous ?</summary>
                    <p>Au Sénégal et en Europe. La liste des pays se règle dans l’espace gérant.</p>
                  </details>
                  <details>
                    <summary>Les prix affichés sont-ils définitifs ?</summary>
                    <p>Non. Ce sont des prix de démonstration, en euros et en francs CFA.</p>
                  </details>
                  <details>
                    <summary>Comment vous écrire ?</summary>
                    <p>Par la page contact, ou au <a href="tel:+221771234567">+221 77 123 45 67</a>. Le formulaire n’envoie pas d’e-mail.</p>
                  </details>
                </div>
              ) : null}
            </section>

            {product.related.length > 0 ? (
              <section className="product-extra">
                <div className="section-head">
                  <h2>Produits similaires</h2>
                  <Link className="more" href="/boutique">Voir tous les produits →</Link>
                </div>
                <div className="shelf fiche-related">
                  {product.related.map((item) => <BookCard key={item.id} product={item} variant="shop" />)}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </StoreFrame>
  );
}
