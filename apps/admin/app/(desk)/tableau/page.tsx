"use client";

import { Boxes, CalendarRange, CircleDollarSign, Gamepad2, PackagePlus, Percent, Settings, ShoppingBag, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import { useAccount } from "@/components/AccountFrame";
import { api, eur, xof } from "@/lib/api";
import { ageLabel, statusLabel } from "@/lib/labels";

type Point = { day: string; label: string; totalEur: number };
type Category = { name: string; key: string; count: number };
type Status = { key: string; label: string; count: number };
type Recent = { id: string; number: string; destination: string; payment: string; status: string; isDemo: boolean; totalEur: number; totalXof: number; createdAt: string };
type Top = { id: string; title: string; ageBand: string; priceEur: number; priceXof: number; categoryKey: string; sold: number };
type Dash = {
  orders: number; toPrepare: number; publishedProducts: number; pendingReviews: number; games: boolean; shopName: string; tagline: string; phone: string;
  revenueEur: number; revenueXof: number; averageEur: number; averageXof: number;
  series: Point[]; categories: Category[]; statuses: Status[]; recent: Recent[]; top: Top[];
};

const colors = ["#14a39a", "#6b2158", "#e0b15a", "#d4527a", "#2f6f8f", "#1f7a45", "#7c4dff"];

export default function Dashboard() {
  const account = useAccount();
  const [data, setData] = useState<Dash | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () => {
      api<Dash>("/api/dashboard").then((row) => { if (alive) setData(row); }).catch((error: Error) => { if (alive) setMessage(error.message); });
    };
    const onFocus = () => load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  async function toggle() {
    if (!data) return;
    const next = await api<{ games: boolean }>("/api/settings/games", { method: "PATCH", body: JSON.stringify({ enabled: !data.games }) });
    setData({ ...data, games: next.games });
  }

  if (!data) return <p>{message || "Chargement…"}</p>;

  const max = Math.max(...data.series.map((point) => point.totalEur), 1);
  const line = data.series.map((point, index) => {
    const x = 28 + (index * 300) / Math.max(data.series.length - 1, 1);
    const y = 150 - (point.totalEur / max) * 110;
    return `${x},${y}`;
  }).join(" ");
  const totalBooks = data.categories.reduce((sum, item) => sum + item.count, 0) || 1;
  let cursor = 0;
  const slices = data.categories.map((item, index) => {
    const share = item.count / totalBooks;
    const start = cursor;
    cursor += share;
    return { ...item, start, share, color: colors[index % colors.length] };
  });
  const statusMax = Math.max(...data.statuses.map((item) => item.count), 1);
  const first = data.series[0]?.label;
  const last = data.series[data.series.length - 1]?.label;
  const hello = account.name ? account.name.split(" ")[0] : "Administrateur";

  return (
    <section className="board">
      <div className="board-head">
        <div>
          <h2>Bonjour, {hello}</h2>
          <p>Voici un aperçu de la boutique aujourd’hui. Chiffres de démonstration.</p>
        </div>
        <p className="board-date"><CalendarRange aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: "-3px", marginRight: 6 }} />{first} – {last}</p>
      </div>
      <div className="board-hero">
        <div className="stats">
          <article className="stat"><i><CircleDollarSign /></i><span>Chiffre d’affaires</span><strong>{xof(data.revenueXof)}</strong><small>{eur(data.revenueEur)}</small></article>
          <article className="stat"><i><ShoppingBag /></i><span>Commandes</span><strong>{data.orders}</strong><small>{data.toPrepare} à préparer</small></article>
          <article className="stat"><i><ShoppingCart /></i><span>Panier moyen</span><strong>{xof(data.averageXof)}</strong><small>{eur(data.averageEur)}</small></article>
          <article className="stat"><i><Users /></i><span>Avis à relire</span><strong>{data.pendingReviews}</strong><small>{data.publishedProducts} livres publiés</small></article>
        </div>
        <aside className="banner-card">
          <small>{data.shopName}</small>
          <p>{data.tagline}</p>
        </aside>
      </div>

      <div className="board-grid">
        <article className="panel">
          <div className="panel-head"><h3>Évolution des ventes</h3><span className="muted">{data.series.length} derniers jours</span></div>
          <svg className="chart" viewBox="0 0 360 180" role="img" aria-label="Ventes des sept derniers jours">
            <polyline fill="none" stroke="#14a39a" strokeWidth="3" points={line} />
            {data.series.map((point, index) => {
              const x = 28 + (index * 300) / Math.max(data.series.length - 1, 1);
              const y = 150 - (point.totalEur / max) * 110;
              return <g key={point.day}><circle cx={x} cy={y} r="3.5" fill="#128a84" /><text x={x} y="172" textAnchor="middle">{point.label.replace(".", "")}</text></g>;
            })}
          </svg>
        </article>
        <article className="panel">
          <div className="panel-head"><h3>Ventes par catégorie</h3></div>
          {slices.length === 0 ? <p className="empty">Aucune vente enregistrée.</p> : (
            <div className="donut-wrap">
              <svg className="donut" viewBox="0 0 42 42" aria-hidden="true">
                <circle cx="21" cy="21" r="15.5" fill="none" stroke="#f3ebe3" strokeWidth="6" />
                {slices.map((slice) => (
                  slice.share >= 0.999
                    ? <circle key={slice.key} cx="21" cy="21" r="15.5" fill="none" stroke={slice.color} strokeWidth="6" />
                    : <circle key={slice.key} cx="21" cy="21" r="15.5" fill="none" stroke={slice.color} strokeWidth="6" strokeDasharray={`${slice.share * 97.4} ${97.4 - slice.share * 97.4}`} strokeDashoffset={25 - slice.start * 97.4} transform="rotate(-90 21 21)" />
                ))}
                <text x="21" y="22" textAnchor="middle" fontSize="4" fill="#2c2430">{totalBooks}</text>
              </svg>
              <div className="legend">
                {slices.map((slice) => <span key={slice.key}><i style={{ background: slice.color }} /><em>{slice.name}</em><b>{Math.round((slice.count / totalBooks) * 100)} %</b></span>)}
              </div>
            </div>
          )}
        </article>
        <article className="panel">
          <div className="panel-head"><h3>Commandes récentes</h3><Link href="/commandes">Voir tout</Link></div>
          <div className="order-list">
            {data.recent.map((order) => (
              <article key={order.id}>
                <strong>{order.number}</strong>
                <span className={order.status === "livree" ? "pill done" : order.status === "a_preparer" ? "pill wait" : "pill"}>{statusLabel(order.status)}</span>
                <small>{order.destination}</small>
                <small>{xof(order.totalXof)}</small>
              </article>
            ))}
            {data.recent.length === 0 && <p className="empty">Aucune commande.</p>}
          </div>
        </article>
      </div>

      <div className="board-grid two">
        <article className="panel">
          <div className="panel-head"><h3>Produits les plus vendus</h3><Link href="/produits">Voir tout</Link></div>
          <table className="rank">
            <thead><tr><th>#</th><th>Livre</th><th>Ventes</th><th>Prix</th></tr></thead>
            <tbody>
              {data.top.length === 0 && <tr><td colSpan={4}>Aucune vente enregistrée.</td></tr>}
              {data.top.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td><span className="thumb"><CoverArt theme={product.categoryKey} /></span>{product.title}<br /><small className="muted">{ageLabel(product.ageBand)}</small></td>
                  <td>{product.sold}</td>
                  <td>{xof(product.priceXof)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="panel">
          <div className="panel-head"><h3>Commandes par statut</h3><Link href="/commandes">Voir tout</Link></div>
          <div className="bars">
            {data.statuses.map((item, index) => (
              <div key={item.key}>
                <i style={{ background: colors[index % colors.length] }} />
                <span>{item.label}<b><span style={{ width: `${(item.count / statusMax) * 100}%` }} /></b></span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <div className="offer" style={{ marginTop: 16 }}>
            <strong>Offrez plus qu’un livre</strong>
            <p>Les coffrets réunissent des lectures du même âge.</p>
            <Link href="/collections">Voir les coffrets</Link>
          </div>
        </article>
        <div className="side-stack">
          <article className="panel">
            <div className="panel-head"><h3>Raccourcis</h3></div>
            <div className="shortcuts">
              <Link href="/produits/nouveau"><PackagePlus /> Ajouter un livre</Link>
              <Link href="/commandes"><ShoppingBag /> Gérer les commandes</Link>
              <Link href="/clients"><Users /> Voir les clients</Link>
              <Link href="/stocks"><Boxes /> Voir le stock</Link>
              <Link href="/promotions"><Percent /> Créer une promotion</Link>
              <Link href="/reglages"><Settings /> Paramètres</Link>
            </div>
          </article>
          <article className="panel">
            <div className="panel-head"><h3><Gamepad2 style={{ width: 16, height: 16 }} /> Rayon jeux</h3></div>
            <p className="muted">Masqué sur la vitrine tant qu’il n’est pas activé.</p>
            <button className="text-link" type="button" onClick={toggle} style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}>{data.games ? "Masquer le rayon" : "Activer le rayon"}</button>
          </article>
        </div>
      </div>
      <p className="board-foot"><span>Fahmia Kids — des livres pour grandir avec la foi.</span><span>Démonstration</span></p>
    </section>
  );
}
