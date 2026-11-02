"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BookCard, type CatalogProduct } from "@/components/BookCard";
import { CoverArt } from "@/components/CoverArt";
import { StoreFrame } from "@/components/StoreFrame";
import { useBannerGsap } from "@/components/useBannerGsap";
import { api } from "@/lib/api";

const MotionLink = motion.create(Link);
const ease = { duration: 0.45, ease: "easeOut" as const };

const categories = [
  ["coran", "Coran pour enfants", "Lire · Comprendre · Aimer"],
  ["prophetes", "Histoires des prophètes", "Des modèles pour la vie"],
  ["arabe", "Apprentissage de l’arabe", "Lire · Écrire · Parler"],
  ["contes", "Contes islamiques", "Des histoires pleines de sagesse"],
  ["jeux", "Activités et jeux", "Apprendre en s’amusant"],
  ["cadeaux", "Coffrets cadeaux", "Pour toutes les occasions"],
] as const;

const giftArt = `<svg viewBox="0 0 460 250" role="img" aria-label="Coffret de livres et lanterne">
  <defs>
    <linearGradient id="gift-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8d3d86"/><stop offset="100%" stop-color="#5c225c"/></linearGradient>
    <linearGradient id="tray" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7a3478"/><stop offset="100%" stop-color="#4e1c4e"/></linearGradient>
    <radialGradient id="lamp" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="#ffe7a8" stop-opacity=".9"/><stop offset="100%" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="250" cy="214" rx="168" ry="12" fill="#ead8c4"/>
  <g><rect x="18" y="96" width="108" height="112" rx="8" fill="url(#gift-face)"/><rect x="64" y="96" width="16" height="112" fill="#f0d48a"/><rect x="18" y="142" width="108" height="14" fill="#e7c56a"/><path d="M72 96c-14-24-36-14-24 2 8 10 24 6 24 6s16 4 24-6c12-16-10-26-24-2z" fill="#f3d78a"/><circle cx="72" cy="94" r="6" fill="#e7c56a"/></g>
  <g><rect x="124" y="92" width="214" height="118" rx="12" fill="url(#tray)"/><rect x="136" y="104" width="190" height="92" rx="7" fill="#f7f0e6"/><rect x="150" y="78" width="78" height="118" rx="3" fill="#167f88"/><rect x="156" y="86" width="66" height="78" rx="2" fill="#f8ecd0"/><circle cx="189" cy="116" r="14" fill="#c9a15a"/><circle cx="196" cy="112" r="11" fill="#f8ecd0"/><path d="M170 154c0-16 38-16 38 0v12h-38z" fill="#1f6b4a"/><rect x="236" y="70" width="82" height="126" rx="3" fill="#e39b3a"/><rect x="243" y="78" width="68" height="84" rx="2" fill="#fff6df"/></g>
  <g><ellipse cx="378" cy="132" rx="40" ry="48" fill="url(#lamp)"/><rect x="366" y="70" width="42" height="10" rx="2" fill="#f3d78a"/><path d="M362 84h50l-8 78h-34z" fill="#f0c14d"/><path d="M372 84l-4 78h28l-4-78z" fill="#ffe7a8"/><rect x="356" y="160" width="62" height="10" rx="2" fill="#e7c56a"/></g>
  <g><circle cx="392" cy="42" r="30" fill="#6b2158"/><text x="392" y="36" text-anchor="middle" fill="#fff" font-size="9" font-family="Outfit, sans-serif">jusqu’à</text><text x="392" y="54" text-anchor="middle" fill="#fff" font-size="15" font-weight="700" font-family="Outfit, sans-serif">-20%</text></g>
</svg>`;

const aboutPoints = [
  ["mission", "Notre mission", "Transmettre les connaissances, les valeurs et la spiritualité à travers la lecture."],
  ["values", "Nos valeurs", "Foi • Éducation • Bienveillance • Qualité"],
  ["why", "Pourquoi nous choisir ?", "Des livres sélectionnés avec soin, une livraison fiable et un service à l’écoute."],
] as const;

const quotes = [
  { name: "Aïssatou D.", text: "Les livres de Fahmia Kids sont vraiment exceptionnels. Ma fille adore ses histoires et apprend beaucoup à chaque lecture. Merci pour cette belle initiative !" },
  { name: "Mamadou S.", text: "Le coffret est clair, l’âge est indiqué, et nous reprenons l’histoire chaque soir. Une belle sélection pour les enfants." },
];

export function HomePage() {
  const bannerRef = useRef<HTMLDivElement>(null);
  useBannerGsap(bannerRef);
  const reduce = useReducedMotion();
  const hidden = reduce ? false : { opacity: 0, y: 24 };
  const hover = reduce ? undefined : { y: -5 };
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [quote, setQuote] = useState(0);
  const [note, setNote] = useState("Cet envoi de maquette ne part pas.");

  useEffect(() => {
    api<CatalogProduct[]>("/api/catalog").then(setProducts).catch(() => setProducts([]));
  }, []);

  function onNews(event: FormEvent) {
    event.preventDefault();
    setNote("Cet envoi de maquette ne part pas.");
  }

  const item = quotes[quote];

  return (
    <StoreFrame current="home">
      <div className="wrap">
        <div className="banner" ref={bannerRef}>
          <div className="banner-copy">
            <p className="banner-kicker">Des livres islamiques pour les enfants</p>
            <h1><span className="plum">Apprendre aujourd’hui,</span><br /><span className="teal">grandir avec la foi.</span></h1>
            <p className="lede">Fahmia Kids propose une sélection de livres islamiques pour accompagner vos enfants dans leur apprentissage, leur épanouissement et leur connexion avec Allah.</p>
            <div className="row">
              <MotionLink className="btn" href="/boutique" whileHover={reduce ? undefined : { y: -3 }} whileTap={reduce ? undefined : { scale: 0.98 }}>Découvrir la boutique →</MotionLink>
              <MotionLink className="btn-line" href="/nouveautes" whileHover={reduce ? undefined : { y: -3 }} whileTap={reduce ? undefined : { scale: 0.98 }}>Voir les nouveautés</MotionLink>
            </div>
          </div>
          <div className="banner-photo">
            <img src="/hero.jpg" alt="Deux enfants lisent ensemble" />
            <span className="banner-shine" aria-hidden="true" />
          </div>
          <div className="banner-perks">
            <motion.article whileHover={hover} transition={ease}><motion.i aria-hidden="true" animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a07d3a" strokeWidth="1.8"><path d="M5 4.5h8.5A2.5 2.5 0 0 1 16 7v12.5H8A3 3 0 0 0 5 16.5z" /><path d="M5 4.5A2.5 2.5 0 0 0 2.5 7v9.5" /><path d="M8.5 8.5h4.5M8.5 12h4.5" strokeLinecap="round" /></svg></motion.i><span><strong>Livres</strong>adaptés à chaque âge</span></motion.article>
            <motion.article whileHover={hover} transition={ease}><motion.i aria-hidden="true" animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.8"><path d="M12 3.2 19.2 6v5.6c0 4.6-3 7.5-7.2 8.6-4.2-1.1-7.2-4-7.2-8.6V6z" /><path d="m9 11.6 2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" /></svg></motion.i><span><strong>Paiement</strong>sécurisé et fiable</span></motion.article>
            <motion.article whileHover={hover} transition={ease}><motion.i aria-hidden="true" animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a07d3a" strokeWidth="1.8"><path d="M3 8h11v7H3z" strokeLinejoin="round" /><path d="M14 11h3.2L20 14v1h-6" strokeLinejoin="round" /><circle cx="7" cy="17.2" r="1.5" /><circle cx="17" cy="17.2" r="1.5" /></svg></motion.i><span><strong>Livraison</strong>Sénégal et Europe</span></motion.article>
            <motion.article whileHover={hover} transition={ease}><motion.i aria-hidden="true" animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c45b4a" strokeWidth="1.8"><path d="M12 19.2s-6.4-3.9-6.4-8.2a3.6 3.6 0 0 1 6.4-2.2 3.6 3.6 0 0 1 6.4 2.2c0 4.3-6.4 8.2-6.4 8.2z" strokeLinejoin="round" /></svg></motion.i><span><strong>Une</strong>équipe à votre écoute</span></motion.article>
          </div>
        </div>

        <div className="section-head">
          <div>
            <h2>Explorer par catégorie</h2>
            <p className="meta">Trouvez facilement les livres qui correspondent aux besoins de votre enfant.</p>
          </div>
          <Link className="more" href="/boutique">Voir toutes les catégories →</Link>
        </div>
        <div className="explore">
          {categories.map(([theme, name, line], index) => (
            <MotionLink
              key={theme}
              href={theme === "cadeaux" ? "/#coffrets" : `/boutique?theme=${theme}`}
              initial={hidden}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={hover}
              transition={{ ...ease, delay: reduce ? 0 : index * 0.06 }}
            >
              <div className="swatch-icon"><CoverArt theme={theme} /></div>
              <strong>{name}</strong>
              <small>{line}</small>
            </MotionLink>
          ))}
        </div>

        <div className="section-head">
          <div>
            <h2 className="mark-crown">Nos meilleures ventes</h2>
            <p className="meta">Les livres préférés des enfants et des parents.</p>
          </div>
          <Link className="more" href="/boutique">Voir tous les best-sellers →</Link>
        </div>
        <div className="shelf">
          {products.slice(0, 5).map((product) => <BookCard key={product.id} product={product} />)}
        </div>

        <motion.div className="band" id="coffrets" initial={hidden} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={ease}>
          <div className="band-copy">
            <p className="band-kicker"><i aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a15a" strokeWidth="1.6"><rect x="4" y="10" width="16" height="10" rx="1.4" /><path d="M4 14h16M12 10v10" /><path d="M12 10c0-2.6-1.8-4.4-3.6-3.6S8.2 10 12 10zm0 0c0-2.6 1.8-4.4 3.6-3.6S15.8 10 12 10z" strokeLinejoin="round" /></svg></i> Coffrets & Packs</p>
            <h2>Des coffrets pour chaque occasion</h2>
            <p>Découvrez nos coffrets thématiques et packs de livres pour faire plaisir tout en offrant une <strong>belle valeur éducative</strong>.</p>
            <MotionLink className="btn" href="/boutique" whileHover={reduce ? undefined : { y: -3 }} whileTap={reduce ? undefined : { scale: 0.98 }}>Voir les coffrets →</MotionLink>
          </div>
          <div className="band-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: giftArt }} />
          <div className="band-side">
            <article><i aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14988f" strokeWidth="1.7"><rect x="4" y="10" width="16" height="10" rx="1.5" /><path d="M4 14.2h16M12 10v10" /></svg></i><span><strong>Idées cadeaux</strong>Anniversaires, Aïd, Ramadan...</span></article>
            <article><i aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14988f" strokeWidth="1.7"><rect x="3.5" y="9" width="8" height="9" rx="1.2" /><rect x="12.5" y="7" width="8" height="11" rx="1.2" /></svg></i><span><strong>Packs thématiques</strong>Récits, valeurs, apprentissage...</span></article>
            <article><i aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14988f" strokeWidth="1.7"><path d="M8 16c-2.4 0-4-1.7-4-4s1.6-4 4-4c1.7 0 2.8 1.1 4 4s2.3 4 4 4c2.4 0 4-1.7 4-4s-1.6-4-4-4c-1.7 0-2.8 1.1-4 4" strokeLinecap="round" /></svg></i><span><strong>Personnalisation possible</strong>Ajoutez un message spécial</span></article>
          </div>
        </motion.div>

        <motion.section className="about" id="apropos" initial={hidden} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={ease}>
          <svg className="about-ornament" viewBox="0 0 64 64" aria-hidden="true"><path fill="#e0b15a" d="M20 3.2 22.4 14.2 33.4 16.6 22.4 19 20 30 17.6 19 6.6 16.6 17.6 14.2z" /><path fill="none" stroke="#e0b15a" strokeWidth="1.1" d="M10 34c10-1 16-8 16-18" /></svg>
          <div className="about-visual">
            <span className="about-blob about-blob-plum" aria-hidden="true" />
            <span className="about-blob about-blob-teal" aria-hidden="true" />
            <span className="about-blob about-blob-teal-2" aria-hidden="true" />
            <div className="about-frame">
              <img src="/about-lecture.jpg" alt="Une mère et son fils lisent Les Histoires des Prophètes" />
            </div>
          </div>
          <div className="about-copy">
            <p className="about-badge"><i aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a07d3a" strokeWidth="1.7"><path d="M5 4.5h8.5A2.5 2.5 0 0 1 16 7v12.5H8A3 3 0 0 0 5 16.5z" /><path d="M8.5 8.5h4.5M8.5 12h4.5" strokeLinecap="round" /></svg></i> À propos de Fahmia Kids</p>
            <h2><span className="plum">Bien plus que des livres,</span><span className="teal">des valeurs pour grandir.</span></h2>
            <p>Fahmia Kids est née d’une conviction : chaque enfant mérite d’avoir accès à des livres qui nourrissent son cœur, son esprit et sa foi. Nous sélectionnons avec soin des ouvrages islamiques adaptés à leur âge, pour les accompagner dans leur apprentissage, leur épanouissement et leur connexion avec Allah.</p>
            <MotionLink className="btn" href="/a-propos" whileHover={reduce ? undefined : { y: -3 }} whileTap={reduce ? undefined : { scale: 0.98 }}>Découvrir notre histoire →</MotionLink>
          </div>
          <div className="about-points">
            {aboutPoints.map(([key, title, line], index) => (
              <motion.article key={key} initial={hidden} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ ...ease, delay: reduce ? 0 : 0.08 + index * 0.06 }}>
                <i className={key === "values" ? "gold" : "teal"} aria-hidden="true">
                  {key === "mission" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.2" /><circle cx="12" cy="12" r="1.1" fill="#128a84" /></svg> : null}
                  {key === "values" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a15a" strokeWidth="1.7"><path d="M12 19.2s-6.4-3.9-6.4-8.2a3.6 3.6 0 0 1 6.4-2.2 3.6 3.6 0 0 1 6.4 2.2c0 4.3-6.4 8.2-6.4 8.2z" strokeLinejoin="round" /></svg> : null}
                  {key === "why" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#128a84" strokeWidth="1.7"><path d="M12 3.4 19 6.2v5.6c0 4.4-3 7.2-7 8.2-4-1-7-3.8-7-8.2V6.2z" /><path d="m9 12 2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                </i>
                <span><strong>{title}</strong>{line}</span>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.div className="trustbar" initial={hidden} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={ease}>
          <article>
            <div className="trust-ico gold"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg></div>
            <strong>Paiement sécurisé</strong>
            <span>Vos informations sont protégées.</span>
          </article>
          <article>
            <div className="trust-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 8h11v8H3z" /><path d="M14 11h4l3 3v2h-7" /><circle cx="7" cy="17.5" r="1.3" /><circle cx="17" cy="17.5" r="1.3" /></svg></div>
            <strong>Livraison rapide</strong>
            <span>Sénégal et Europe.</span>
          </article>
          <article>
            <div className="trust-ico gold"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg></div>
            <strong>Service client</strong>
            <span>Une équipe disponible 7j/7.</span>
          </article>
          <article>
            <div className="trust-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 5h10a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3z" /><path d="M8 5v14" /></svg></div>
            <strong>Livres de qualité</strong>
            <span>Sélectionnés avec soin.</span>
          </article>
          <article>
            <div className="trust-ico gold"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12a8 8 0 1 0 2.2-5.5" /><path d="M4 5v5h5" /></svg></div>
            <strong>Retour sous 14 jours</strong>
            <span>Selon les conditions.</span>
          </article>
        </motion.div>

        <div className="proof">
          <motion.article className="quote-card" initial={hidden} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={ease}>
            <h3 className="quote-head"><i aria-hidden="true" /> Ils nous font confiance</h3>
            <p className="sub">Des parents satisfaits, des enfants épanouis.</p>
            <div className="quote-row">
              <button className="quote-nav" type="button" aria-label="Avis précédent" onClick={() => setQuote((index) => (index + quotes.length - 1) % quotes.length)}>‹</button>
              <div className="quote-body">
                <div className="avatar" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="#f4e7da" /><ellipse cx="40" cy="44" rx="13" ry="15" fill="#c68658" /></svg></div>
                <div>
                  <p><span className="quote-mark" aria-hidden="true">“</span>{item.text}</p>
                  <strong>{item.name}</strong>
                  <div className="quote-stars" aria-label="5 étoiles sur 5">★★★★★</div>
                  <span className="demo-note">Avis de démonstration</span>
                </div>
              </div>
              <button className="quote-nav" type="button" aria-label="Avis suivant" onClick={() => setQuote((index) => (index + 1) % quotes.length)}>›</button>
            </div>
          </motion.article>
          <motion.form className="news-card" onSubmit={onNews} initial={hidden} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ ...ease, delay: reduce ? 0 : 0.08 }}>
            <div>
              <h3 className="news-kicker"><i aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e7c56a" strokeWidth="1.6"><path d="M4 7h16v10H4z" /><path d="m4 8 8 6 8-6" /></svg></i> Notre newsletter</h3>
              <p>Recevez nos nouveautés, nos offres exclusives et nos conseils pour accompagner vos enfants.</p>
              <div className="news-row">
                <input type="email" placeholder="Votre adresse e-mail" aria-label="E-mail pour la lettre" required />
                <motion.button className="btn" type="submit" whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: 0.98 }}>S’inscrire</motion.button>
              </div>
              <label className="news-consent"><input type="checkbox" required /> <span>J’accepte de recevoir les informations de Fahmia Kids.</span></label>
              <p className="fine">{note}</p>
            </div>
            <div className="news-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 200 168"><path fill="#f3d78a" d="M28 22l1.6 4.2h4.4l-3.6 2.6 1.4 4.2-3.8-2.8-3.8 2.8 1.4-4.2-3.6-2.6h4.4z"/><path fill="#f0d48a" d="M8 168V118h6v-22h5v22h6v50z"/><path fill="#f0d48a" d="M46 168V104h40v64z"/><path fill="#f0d48a" d="M50 104c12-32 32-32 32 0z"/><path fill="#e7c56a" d="M154 44h24l-4 40h-16z"/><path fill="#ffe7a8" d="M160 44l-2 40h12l-2-40z"/></svg>` }} />
          </motion.form>
        </div>
      </div>
    </StoreFrame>
  );
}
