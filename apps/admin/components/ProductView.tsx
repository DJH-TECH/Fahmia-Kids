"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCard, type CatalogProduct } from "@/components/BookCard";
import { CoverArt, coverTheme } from "@/components/CoverArt";
import { StoreFrame } from "@/components/StoreFrame";
import { api, eur, xof } from "@/lib/api";
import { loadSpace, rememberSpace, type SpaceSnapshot } from "@/lib/space";
import { ageLabel, typeLabel } from "@/lib/labels";
import "../app/home.css";

type Review = { id: string; authorName: string; body: string; rating: number; isDemo: boolean };
type ProductDetail = CatalogProduct & {
  description?: string;
  advice?: string;
  type?: string;
  reviews: Review[];
  related: CatalogProduct[];
};

export function ProductView({ id }: { id: string }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [message, setMessage] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    setMessage("");
    setAdded(false);
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
    const next = await api<SpaceSnapshot>("/api/space/cart", { method: "POST", body: JSON.stringify({ productId: id }) });
    rememberSpace(next);
    setAdded(true);
  }

  const stock = product?.stock ?? 0;

  return (
    <StoreFrame current="shop">
      <div className="wrap">
        <p className="crumb"><Link href="/boutique">Boutique</Link>{product?.categoryName ? <> · <Link href={`/boutique?theme=${product.categoryKey}`}>{product.categoryName}</Link></> : null}</p>
        {message ? <p className="meta">{message}</p> : null}
        {!product && !message ? <p className="meta">Chargement…</p> : null}
        {product ? (
          <>
            <article className="product-page">
              <div className="cover" style={{ background: "#4e2348" }}>
                {product.promoPercent ? <span className="badge">Promo −{product.promoPercent} %</span> : null}
                {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <CoverArt theme={coverTheme(product.categoryKey)} />}
              </div>
              <div>
                <p className="kicker">{product.categoryName || "Catalogue"}{product.author ? ` · ${product.author}` : ""}</p>
                <h1>{product.title}</h1>
                <p className="price">
                  {product.compareEur ? <s>{eur(product.compareEur)}</s> : null}
                  {eur(product.priceEur)}
                  <small>{xof(product.priceXof)}</small>
                </p>
                <p>{product.blurb}</p>
                <p className="meta">
                  {typeLabel(product.type || "BOOK")} · {ageLabel(product.ageBand)} · {stock < 1 ? "Rupture" : stock <= 5 ? `Plus que ${stock} en stock` : "En stock"}
                  {product.isDemo ? " · donnée de démonstration" : ""}
                </p>
                {product.advice ? <div className="advice"><strong>Pour les parents.</strong> {product.advice}</div> : null}
                <div className="product-actions">
                  <button className="btn-teal" type="button" disabled={stock < 1} onClick={addToCart}>{stock < 1 ? "Rupture" : added ? "Ajouté" : "Ajouter au panier"}</button>
                  <button className={favorite ? "btn-fav on" : "btn-fav"} type="button" onClick={toggleFavorite}>{favorite ? "Dans les favoris" : "Mettre en favori"}</button>
                </div>
              </div>
            </article>
            {product.description ? (
              <section className="product-extra">
                <h2>Description</h2>
                <p className="description">{product.description}</p>
              </section>
            ) : null}
            <section className="product-extra">
              <h2>Avis</h2>
              {product.reviews.length === 0 ? <p className="meta">Aucun avis publié. Le gérant décide ce qui apparaît.</p> : product.reviews.map((review) => (
                <article className="review" key={review.id}>
                  <p className="stars">{"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))} <span>{review.authorName}{review.isDemo ? " · démonstration" : ""}</span></p>
                  <p>{review.body}</p>
                </article>
              ))}
            </section>
            {product.related.length > 0 ? (
              <section className="product-extra">
                <div className="section-head"><h2>Souvent choisis avec</h2></div>
                <div className="shelf">
                  {product.related.map((item) => <BookCard key={item.id} product={item} />)}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </StoreFrame>
  );
}
