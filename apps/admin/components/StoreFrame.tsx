"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, MouseEvent, ReactNode, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { loadSpace } from "@/lib/space";

const MotionLink = motion.create(Link);

const iconMotion = {
  user: { y: [0, -4, 0], scale: 1, rotate: 0 },
  heart: { scale: [1, 1.16, 1], y: 0, rotate: 0 },
  cart: { rotate: [0, -8, 0, 8, 0], y: 0, scale: 1 },
} as const;

const cats = [
  ["Coran pour enfants", "coran"],
  ["Histoires des prophètes", "prophetes"],
  ["Apprentissage de l’arabe", "arabe"],
  ["Contes islamiques", "contes"],
  ["Activités et jeux", "jeux"],
  ["Coffrets cadeaux", "cadeaux"],
] as const;

export function StoreFrame({ current, children }: { current: "home" | "shop" | "contact" | "favorites" | "cart" | "about" | "news"; children: ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [accountHref, setAccountHref] = useState("/connexion");
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [partners, setPartners] = useState<{ name: string; logoUrl: string }[]>([]);

  useEffect(() => {
    let alive = true;
    api("/api/auth/me")
      .then(() => { if (alive) setAccountHref("/tableau"); })
      .catch(() => { if (alive) setAccountHref("/connexion"); });
    const readSpace = () => {
      loadSpace()
        .then((space) => {
          if (!alive) return;
          setFavoriteCount(space.favorites.length);
          setCartCount((space.cart ?? []).reduce((sum, line) => sum + line.qty, 0));
        })
        .catch(() => {
          if (!alive) return;
          setFavoriteCount(0);
          setCartCount(0);
        });
    };
    readSpace();
    api<{ partners?: { name: string; logoUrl: string }[] }>("/api/shop")
      .then((shop) => { if (alive) setPartners(shop.partners ?? []); })
      .catch(() => { if (alive) setPartners([]); });
    const onSpace = () => readSpace();
    window.addEventListener("fahmia-space", onSpace);
    return () => {
      alive = false;
      window.removeEventListener("fahmia-space", onSpace);
    };
  }, []);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") || "").trim();
    router.push(query ? `/boutique?q=${encodeURIComponent(query)}` : "/boutique");
  }

  function onAccount(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    api("/api/auth/me")
      .then(() => router.push("/tableau"))
      .catch(() => router.push("/connexion"));
  }

  return (
    <div className="storefront">
      <div className="topbar">
        <span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="17" r="1.6" /><circle cx="18" cy="17" r="1.6" /></svg>
          Livraison au Sénégal et en Europe
        </span>
        <span className="mid">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 5h10a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3z" /><path d="M5 5v14" /></svg>
          Des livres qui éveillent les cœurs
        </span>
        <span className="end">Service client : +221 77 123 45 67</span>
      </div>
      <header className="header">
        <Link className="logo" href="/" aria-label="Fahmia Kids, accueil">
          <img src="/logo-mark.png" alt="Fahmia Kids" />
        </Link>
        <form className="search" onSubmit={onSearch}>
          <input name="q" type="search" placeholder="Rechercher un livre, un auteur, un thème..." aria-label="Rechercher" />
          <motion.button type="submit" aria-label="Rechercher" initial="rest" whileHover="hover">
            <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -16, scale: 1.12 } }} transition={{ duration: 0.25 }}>
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </motion.svg>
          </motion.button>
        </form>
        <div className="tools">
          {([
            [accountHref, "Mon compte", "user", <svg key="user" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.2" /><path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19" /></svg>, false],
            ["/favoris", "Favoris", "heart", <svg key="heart" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" /></svg>, true],
            ["/panier", "Panier", "cart", <svg key="cart" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 7h15l-1.6 8H8z" /><path d="M6 7L5 4H2" /><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></svg>, true],
          ] as const).map(([href, label, kind, icon, badge]) => (
            <MotionLink key={label} href={href} onClick={kind === "user" ? onAccount : undefined} initial="rest" animate={reduce ? "rest" : "play"} whileHover="hover">
              <motion.span
                className="tool-ico"
                aria-hidden="true"
                variants={{
                  rest: { y: 0, scale: 1, rotate: 0 },
                  play: { ...iconMotion[kind], transition: { duration: kind === "heart" ? 1.25 : 2.2, repeat: Infinity, ease: "easeInOut" } },
                  hover: { scale: 1.2, y: -2, rotate: 0, transition: { duration: 0.2 } },
                }}
              >
                {icon}{badge ? <b>{kind === "heart" ? favoriteCount : cartCount}</b> : null}
              </motion.span>
              {label}
            </MotionLink>
          ))}
        </div>
        <nav className="nav">
          <Link href="/" aria-current={current === "home" ? "page" : undefined}>Accueil</Link>
          <Link href="/boutique" aria-current={current === "shop" ? "page" : undefined}>Boutique</Link>
          <Link href="/nouveautes" aria-current={current === "news" ? "page" : undefined}>Nouveautés</Link>
          <Link href="/a-propos" aria-current={current === "about" ? "page" : undefined}>À propos</Link>
          <Link href="/contact" aria-current={current === "contact" ? "page" : undefined}>Contact</Link>
        </nav>
      </header>
      {children}
      <footer className="site">
        <div className="foot-top">
          <div className="foot-brand">
            <img src="/logo-mark.png" alt="Fahmia Kids" />
            <p>Des livres islamiques pour un avenir meilleur.</p>
          </div>
          <div>
            <strong>Navigation</strong>
            <Link href="/">Accueil</Link>
            <Link href="/boutique">Boutique</Link>
            <Link href="/a-propos" aria-current={current === "about" ? "page" : undefined}>À propos</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <strong>Catégories</strong>
            {cats.map(([name, key]) => <Link key={key} href={`/boutique?theme=${key}`}>{name}</Link>)}
          </div>
          <div>
            <strong>Contact</strong>
            <a className="foot-phone" href="tel:+221771234567">+221 77 123 45 67</a>
            <p>Sénégal & Europe</p>
          </div>
        </div>
        {partners.length > 0 ? (
          <div className="partners">
            <strong>Liste des partenaires</strong>
            <div className="partner-row">
              {partners.map((partner) => (
                <span className="partner" key={partner.name}>
                  {partner.logoUrl ? <img src={partner.logoUrl} alt="" /> : null}
                  {partner.name}
                </span>
              ))}
            </div>
            <p>Partenaires de démonstration</p>
          </div>
        ) : null}
        <div className="legal">
          <span>© 2026 Fahmia Kids. Tous droits réservés. Prix et avis de démonstration.</span>
          <span>Des livres islamiques pour un avenir meilleur.</span>
        </div>
      </footer>
    </div>
  );
}
