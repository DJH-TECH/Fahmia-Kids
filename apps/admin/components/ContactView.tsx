"use client";

import { FormEvent, useEffect, useState } from "react";
import { StoreFrame } from "@/components/StoreFrame";
import { api } from "@/lib/api";
import "../app/home.css";

type Shop = { name: string; tagline: string; phone: string; countries?: string[] };

export function ContactView() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    api<Shop>("/api/shop").then(setShop).catch(() => setShop({
      name: "Fahmia Kids",
      tagline: "",
      phone: "+221 77 123 45 67",
      countries: [],
    }));
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setNote("Message noté sur cette page seulement. Aucun e-mail n’est envoyé.");
  }

  const phone = shop?.phone || "+221 77 123 45 67";
  const countries = shop?.countries?.filter(Boolean) ?? [];

  return (
    <StoreFrame current="contact">
      <div className="wrap">
        <header className="contact-hero">
          <p className="contact-kicker">Service client</p>
          <h2><span className="plum">On vous écoute,</span><span className="teal">écrivez-nous.</span></h2>
          <p>Une question sur un livre, une commande ou un coffret.</p>
        </header>
        <div className="contact-facts">
          <article>
            <i className="teal" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><path d="M8 4h8v16H8z" /><path d="M11 18h2" /></svg></i>
            <span><strong>Téléphone</strong><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></span>
          </article>
          <article>
            <i className="gold" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a07d3a" strokeWidth="1.7"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.2" /></svg></i>
            <span><strong>Livraison</strong>Sénégal et Europe</span>
          </article>
          <article>
            <i className="teal" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg></i>
            <span><strong>Livres et coffrets</strong>Commandes et questions</span>
          </article>
        </div>
        <div className="contact-layout">
          <figure className="contact-map">
            <iframe
              title="Carte du Sénégal, zone de livraison Fahmia Kids"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-17.55%2C12.30%2C-11.35%2C16.70&layer=mapnik"
              loading="lazy"
            />
            <figcaption>
              <strong>Zone de livraison</strong>
              {countries.length ? (
                <ul className="contact-countries">
                  {countries.map((country) => <li key={country}>{country}</li>)}
                </ul>
              ) : <p>Les pays se règlent dans l’espace gérant.</p>}
            </figcaption>
          </figure>
          <form className="contact-card contact-form" onSubmit={onSubmit}>
            <h3>Écrire</h3>
            <p>Le message reste sur cette page. Aucun e-mail n’est envoyé.</p>
            <label>Nom<input name="name" type="text" autoComplete="name" required /></label>
            <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
            <label>Message<textarea name="message" required rows={6} /></label>
            <button className="btn-teal" type="submit">Envoyer</button>
            <p className="meta">{note || "Cet envoi de maquette ne part pas."}</p>
          </form>
        </div>
      </div>
    </StoreFrame>
  );
}
