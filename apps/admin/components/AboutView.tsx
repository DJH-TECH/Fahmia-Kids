"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreFrame } from "@/components/StoreFrame";
import { api } from "@/lib/api";
import "../app/home.css";

type Shop = { name: string; tagline: string; phone: string; countries?: string[] };

const points = [
  ["mission", "Notre mission", "Transmettre les connaissances, les valeurs et la spiritualité à travers la lecture."],
  ["values", "Nos valeurs", "Foi, éducation, bienveillance et qualité, dans chaque livre choisi."],
  ["why", "Pourquoi nous choisir", "Des livres sélectionnés avec soin, une livraison fiable et un service à l’écoute."],
] as const;

export function AboutView() {
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    api<Shop>("/api/shop").then(setShop).catch(() => setShop(null));
  }, []);

  const phone = shop?.phone || "+221 77 123 45 67";
  const countries = shop?.countries?.filter(Boolean) ?? [];
  const name = shop?.name || "Fahmia Kids";

  return (
    <StoreFrame current="about">
      <div className="wrap">
        <header className="story-hero">
          <div className="story-photo">
            <img src="/about-lecture.jpg" alt="Une mère et son fils lisent Les Histoires des Prophètes" />
          </div>
          <div className="story-lead">
            <p className="story-kicker">À propos de {name}</p>
            <h2><span className="plum">Bien plus que des livres,</span><span className="teal">des valeurs pour grandir.</span></h2>
            <p>Fahmia Kids est née d’une conviction : chaque enfant mérite d’avoir accès à des livres qui nourrissent son cœur, son esprit et sa foi.</p>
            {shop?.tagline ? <p className="story-tag">{shop.tagline}</p> : null}
            <div className="story-actions">
              <Link className="btn" href="/boutique">Découvrir la boutique</Link>
              <Link className="btn-line" href="/contact">Nous écrire</Link>
            </div>
          </div>
        </header>

        <div className="story-points">
          {points.map(([key, title, line]) => (
            <article key={key}>
              <i className={key === "values" ? "gold" : "teal"} aria-hidden="true">
                {key === "mission" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.2" /><circle cx="12" cy="12" r="1.1" fill="#128a84" /></svg> : null}
                {key === "values" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a15a" strokeWidth="1.7"><path d="M12 19.2s-6.4-3.9-6.4-8.2a3.6 3.6 0 0 1 6.4-2.2 3.6 3.6 0 0 1 6.4 2.2c0 4.3-6.4 8.2-6.4 8.2z" strokeLinejoin="round" /></svg> : null}
                {key === "why" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><path d="M12 3.4 19 6.2v5.6c0 4.4-3 7.2-7 8.2-4-1-7-3.8-7-8.2V6.2z" /><path d="m9 12 2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
              </i>
              <strong>{title}</strong>
              <span>{line}</span>
            </article>
          ))}
        </div>

        <section className="story-split">
          <div className="story-text">
            <h2>Notre histoire</h2>
            <p>Le catalogue reste court pour qu’un parent voie l’âge et le thème sans se perdre. Un récit du soir, une lettre arabe, un passage du Coran : chaque livre a une place claire.</p>
            <p>Nous choisissons des ouvrages qu’un adulte peut lire une page à la fois, puis laisser l’enfant raconter ce qu’il a vu. Les prix, les stocks et les avis marqués démonstration restent des données de maquette.</p>
          </div>
          <aside className="story-aside">
            <h3>Les colis</h3>
            <p>Nous ne publions pas d’adresse de boutique. La livraison couvre le Sénégal et l’Europe.</p>
            {countries.length ? (
              <ul className="contact-countries">
                {countries.map((country) => <li key={country}>{country}</li>)}
              </ul>
            ) : <p>Les pays de livraison s’affichent ici dès qu’ils sont réglés.</p>}
            <a className="story-phone" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
            <Link href="/contact">Page contact</Link>
          </aside>
        </section>
      </div>
    </StoreFrame>
  );
}
