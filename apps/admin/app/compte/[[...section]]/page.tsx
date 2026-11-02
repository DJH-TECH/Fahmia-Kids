"use client";

import { BookOpen, Heart, MapPin, MessageCircle, Package, Store } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { CoverArt } from "@/components/CoverArt";
import { useClientSpace } from "@/components/AccountFrame";
import { api, eur } from "@/lib/api";
import { ageLabel, statusLabel } from "@/lib/labels";

export default function ClientAccount() {
  const params = useParams<{ section?: string[] }>();
  const key = params.section?.[0] || "";
  const { space, reload } = useClientSpace();
  const [message, setMessage] = useState("");

  if (!space) return <p>Chargement…</p>;

  const hello = space.customer.name || "Bonjour";
  const phoneHref = `tel:${space.shop.phone.replace(/\s/g, "")}`;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/api/space", {
      method: "PATCH",
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), phone: form.get("phone") }),
    });
    setMessage("Informations enregistrées.");
    reload();
  }

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await api("/api/space/addresses", {
      method: "POST",
      body: JSON.stringify({ label: data.get("label"), line: data.get("line"), city: data.get("city"), country: data.get("country") }),
    });
    form.reset();
    reload();
  }

  async function removeAddress(id: string) {
    await api(`/api/space/addresses/${id}`, { method: "DELETE" });
    reload();
  }

  async function removeFavorite(productId: string) {
    await api(`/api/space/favorites/${productId}`, { method: "DELETE" });
    reload();
  }

  if (key === "commandes") {
    return (
      <section className="board">
        <div className="board-head"><div><h2>Mes commandes</h2><p>{space.orders.length} commande{space.orders.length > 1 ? "s" : ""} sur ce compte.</p></div></div>
        <article className="panel" style={{ marginTop: 16 }}>
          {space.orders.length === 0 ? <p className="empty">Aucune commande pour le moment.</p> : (
            <table className="rank">
              <thead><tr><th>Numéro</th><th>Destination</th><th>Statut</th><th>Total</th></tr></thead>
              <tbody>
                {space.orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.number}</td>
                    <td>{order.destination}</td>
                    <td>{statusLabel(order.status)}</td>
                    <td>{eur(order.totalEur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="client-actions"><Link href="/boutique"><Store /> Voir la boutique</Link></div>
        </article>
      </section>
    );
  }

  if (key === "favoris") {
    return (
      <section className="board">
        <div className="board-head"><div><h2>Favoris</h2><p>{space.favorites.length} livre{space.favorites.length > 1 ? "s" : ""} mis de côté.</p></div></div>
        <article className="panel" style={{ marginTop: 16 }}>
          {space.favorites.length === 0 ? <p className="empty">Aucun favori. Le cœur sur une couverture de la boutique l’ajoute ici.</p> : (
            <div className="order-list">
              {space.favorites.map((item) => (
                <article key={item.id}>
                  <strong><span className="thumb"><CoverArt theme={item.categoryKey} /></span> {item.title}</strong>
                  <button className="text-link" type="button" onClick={() => removeFavorite(item.productId || item.id)}>Retirer</button>
                  <small>{item.ageBand ? ageLabel(item.ageBand) : ""}</small>
                  <small>{eur(item.priceEur)}</small>
                </article>
              ))}
            </div>
          )}
          <div className="client-actions"><Link href="/boutique"><Store /> Choisir un livre</Link></div>
        </article>
      </section>
    );
  }

  if (key === "adresses") {
    return (
      <section className="board">
        <div className="board-head"><div><h2>Adresses</h2><p>{space.addresses.length} adresse{space.addresses.length > 1 ? "s" : ""} · livraison vers {space.countries.map((country) => country.name).join(", ") || "les pays ouverts"}.</p></div></div>
        <article className="panel" style={{ marginTop: 16 }}>
          {space.addresses.length === 0 ? <p className="empty">Aucune adresse enregistrée.</p> : space.addresses.map((address) => (
            <p key={address.id}>{address.label} · {address.line}{address.city ? `, ${address.city}` : ""} · {address.country} <button className="text-link" type="button" onClick={() => removeAddress(address.id)}>Retirer</button></p>
          ))}
          <form className="client-form" onSubmit={addAddress}>
            <label>Libellé<input name="label" type="text" placeholder="Domicile" /></label>
            <label>Adresse<input name="line" type="text" required /></label>
            <label>Ville<input name="city" type="text" /></label>
            <label>Pays
              <select name="country" required defaultValue="">
                <option value="" disabled>Choisir</option>
                {space.countries.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}
              </select>
            </label>
            <button className="text-link" type="submit">Enregistrer l’adresse</button>
          </form>
        </article>
      </section>
    );
  }

  if (key === "informations") {
    return (
      <section className="board">
        <div className="board-head"><div><h2>Informations</h2><p>Ces informations restent sur ce navigateur, liées à votre compte client.</p></div></div>
        <article className="panel" style={{ marginTop: 16 }}>
          <form className="client-form" onSubmit={saveProfile}>
            <label>Nom<input name="name" type="text" defaultValue={space.customer.name} /></label>
            <label>E-mail<input name="email" type="email" defaultValue={space.customer.email} /></label>
            <label>Téléphone<input name="phone" type="tel" defaultValue={space.customer.phone} /></label>
            <button className="text-link" type="submit">Enregistrer</button>
          </form>
          {message ? <p className="client-note">{message}</p> : null}
        </article>
      </section>
    );
  }

  if (key === "aide") {
    return (
      <section className="board">
        <div className="board-head"><div><h2>Aide</h2><p>Le service client de {space.shop.name}.</p></div></div>
        <article className="panel" style={{ marginTop: 16 }}>
          <p className="client-note">Pour une question sur un livre, une commande ou un coffret : {space.shop.phone}.</p>
          <div className="client-actions">
            <a href={phoneHref}><MessageCircle /> Appeler</a>
            <Link href="/boutique"><Store /> Voir la boutique</Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="board">
      <div className="board-head">
        <div>
          <h2>{space.customer.name ? `Bonjour, ${space.customer.name.split(" ")[0]}` : hello}</h2>
          <p>Vos commandes, vos favoris et vos adresses, lus dans la boutique.</p>
        </div>
      </div>
      <div className="board-hero">
        <div className="stats">
          <article className="stat"><i><Package /></i><span>Mes commandes</span><strong>{space.orders.length}</strong><small>{space.orders.length ? "Sur ce compte" : "Aucune pour le moment"}</small></article>
          <article className="stat"><i><Heart /></i><span>Favoris</span><strong>{space.favorites.length}</strong><small>Livres mis de côté</small></article>
          <article className="stat"><i><MapPin /></i><span>Adresses</span><strong>{space.addresses.length}</strong><small>{space.countries.length} pays ouverts</small></article>
          <article className="stat"><i><BookOpen /></i><span>Catalogue</span><strong>{space.picks.length}</strong><small>{space.categories.length} catégories</small></article>
        </div>
        <aside className="banner-card">
          <small>{space.shop.name}</small>
          <p>{space.shop.tagline}</p>
        </aside>
      </div>
      <div className="board-grid two">
        <article className="panel">
          <div className="panel-head"><h3>Mes commandes</h3><Link href="/compte/commandes">Voir</Link></div>
          {space.orders.length === 0 ? <p className="empty">Aucune commande pour le moment.</p> : space.orders.slice(0, 3).map((order) => (
            <p key={order.id}>{order.number} · {statusLabel(order.status)} · {eur(order.totalEur)}</p>
          ))}
          <div className="client-actions"><Link href="/boutique"><Store /> Continuer mes achats</Link></div>
        </article>
        <article className="panel">
          <div className="panel-head"><h3>À lire ensuite</h3><Link href="/boutique">Boutique</Link></div>
          <div className="client-actions">
            {space.categories.slice(0, 4).map((category) => (
              <Link key={category.key} href={`/boutique?theme=${category.key}`}><BookOpen /> {category.name}</Link>
            ))}
          </div>
          {space.picks.slice(0, 3).map((product) => <p key={product.id}>{product.title} · {eur(product.priceEur)}</p>)}
        </article>
        <article className="panel">
          <div className="panel-head"><h3>Favoris</h3><Link href="/compte/favoris">Voir</Link></div>
          {space.favorites.length === 0 ? <p className="empty">Ajoutez un cœur sur un livre de la boutique.</p> : space.favorites.slice(0, 3).map((item) => <p key={item.id}>{item.title}</p>)}
          <div className="shortcuts">
            <Link href="/compte/commandes"><Package /> Mes commandes</Link>
            <Link href="/compte/favoris"><Heart /> Favoris</Link>
            <Link href="/compte/adresses"><MapPin /> Adresses</Link>
            <Link href="/compte/aide"><MessageCircle /> Aide</Link>
          </div>
        </article>
      </div>
      <p className="board-foot"><span>{space.shop.name} · compte client</span><span>{space.shop.phone}</span></p>
    </section>
  );
}
