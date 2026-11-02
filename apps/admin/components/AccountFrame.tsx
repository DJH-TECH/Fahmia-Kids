"use client";

import {
  Bell,
  BookOpen,
  Boxes,
  CreditCard,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  Library,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Package,
  Percent,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import "@/app/account.css";

type Profile = { name: string; email: string };

const AccountContext = createContext<Profile>({ name: "", email: "" });

export type SpaceProduct = { id: string; productId?: string; title: string; priceEur: number; priceXof?: number; ageBand?: string; categoryKey: string };
export type SpaceAddress = { id: string; label: string; line: string; city: string; country: string };
export type SpaceOrder = { id: string; number: string; destination: string; status: string; totalEur: number; isDemo: boolean };
export type ClientSpace = {
  customer: { id: string; name: string; email: string; phone: string };
  favorites: SpaceProduct[];
  addresses: SpaceAddress[];
  orders: SpaceOrder[];
  categories: { name: string; key: string }[];
  countries: { name: string; code: string }[];
  picks: SpaceProduct[];
  shop: { name: string; tagline: string; phone: string };
};

const SpaceContext = createContext<{ space: ClientSpace | null; reload: () => void }>({ space: null, reload: () => {} });

export function useAccount() {
  return useContext(AccountContext);
}

export function useClientSpace() {
  return useContext(SpaceContext);
}

type LinkItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
type Group = { label: string; icon: LucideIcon; items: LinkItem[] };

const adminGroups: Group[] = [
  {
    label: "Catalogue",
    icon: Library,
    items: [
      { href: "/produits", label: "Livres", icon: BookOpen },
      { href: "/categories", label: "Catégories", icon: Tags },
      { href: "/collections", label: "Coffrets & Packs", icon: Gift },
      { href: "/promotions", label: "Promotions", icon: Percent },
    ],
  },
  {
    label: "Commandes",
    icon: ShoppingBag,
    items: [
      { href: "/commandes", label: "Toutes les commandes", icon: ShoppingBag },
      { href: "/commandes#livraisons", label: "Livraisons", icon: Truck, exact: true },
      { href: "/commandes#retours", label: "Retours & remboursements", icon: RotateCcw, exact: true },
      { href: "/avis", label: "Avis", icon: MessageSquare },
    ],
  },
  {
    label: "Clients",
    icon: Users,
    items: [
      { href: "/clients", label: "Tous les clients", icon: Users },
      { href: "/clients#roles", label: "Rôles & permissions", icon: Shield, exact: true },
    ],
  },
  {
    label: "Stock",
    icon: Boxes,
    items: [
      { href: "/stocks", label: "Gestion des stocks", icon: Boxes },
      { href: "/stocks#mouvements", label: "Mouvements", icon: Package, exact: true },
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    items: [
      { href: "/promotions", label: "Campagnes", icon: Megaphone },
      { href: "/journal", label: "Newsletter", icon: Mail },
    ],
  },
  {
    label: "Contenus",
    icon: FileText,
    items: [
      { href: "/pages", label: "Pages éditoriales", icon: FileText },
      { href: "/medias", label: "Bannières", icon: ImageIcon },
    ],
  },
  {
    label: "Paramètres",
    icon: Settings,
    items: [
      { href: "/reglages", label: "Boutique", icon: Store },
      { href: "/reglages#paiements", label: "Paiements", icon: CreditCard, exact: true },
      { href: "/reglages#livraison", label: "Livraison", icon: MapPin, exact: true },
    ],
  },
];

const clientGroups: Group[] = [
  {
    label: "Mes achats",
    icon: ShoppingBag,
    items: [
      { href: "/compte/commandes", label: "Mes commandes", icon: Package },
      { href: "/compte/favoris", label: "Favoris", icon: Heart },
    ],
  },
  {
    label: "Mon espace",
    icon: UserRound,
    items: [
      { href: "/compte/adresses", label: "Adresses", icon: MapPin },
      { href: "/compte/informations", label: "Informations", icon: UserRound },
      { href: "/compte/aide", label: "Aide", icon: HelpCircle },
    ],
  },
];

function isCurrent(pathname: string, item: LinkItem) {
  const href = item.href.split("#")[0];
  if (item.exact || href === "/tableau" || href === "/compte") return pathname === item.href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountFrame({ mode, children }: { mode: "admin" | "client"; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });
  const [notes, setNotes] = useState(false);
  const [ready, setReady] = useState(false);
  const [space, setSpace] = useState<ClientSpace | null>(null);
  const [tick, setTick] = useState(0);
  const groups = mode === "admin" ? adminGroups : clientGroups;
  const home = mode === "admin" ? "/tableau" : "/compte";
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (!ready || mode !== "admin") return;
    api<Profile>("/api/auth/me").then(setProfile).catch(() => router.replace("/connexion"));
  }, [mode, ready, router]);
  useEffect(() => {
    if (!ready || mode !== "client") return;
    api<ClientSpace>("/api/space").then((row) => {
      setSpace(row);
      setProfile({ name: row.customer.name, email: row.customer.email });
    }).catch(() => setSpace(null));
  }, [mode, ready, tick]);

  async function logout() {
    try {
      if (mode === "client") await api("/api/space/logout", { method: "POST" });
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/connexion");
    }
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") || "").trim();
    if (mode === "admin") router.push(query ? `/produits?q=${encodeURIComponent(query)}` : "/produits");
    else router.push(query ? `/boutique?q=${encodeURIComponent(query)}` : "/boutique");
  }

  const display = mode === "admin" ? (profile.name || "Administrateur") : (profile.name || "Compte client");
  const role = mode === "admin" ? "Administrateur" : "Parent";

  if (!ready) return <div className="account" suppressHydrationWarning />;

  return (
    <AccountContext.Provider value={profile}>
    <SpaceContext.Provider value={{ space, reload }}>
      <div className="account">
        <aside className="account-side">
          <Link href={home} className="account-logo">
            <img src="/logo-mark.png" alt="Fahmia Kids" />
          </Link>
          <nav>
            <Link href={home} className="account-link" aria-current={pathname === home ? "page" : undefined}>
              <LayoutDashboard aria-hidden="true" /> Tableau de bord
            </Link>
            {groups.map((group) => (
              <details key={group.label} open className="account-group">
                <summary><group.icon aria-hidden="true" /> {group.label}</summary>
                <div>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} className="account-sub" aria-current={isCurrent(pathname, item) ? "page" : undefined}>
                      <item.icon aria-hidden="true" /> {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </nav>
          <button className="account-logout" type="button" onClick={logout}>
            <LogOut aria-hidden="true" /> Se déconnecter
          </button>
        </aside>
        <div className="account-main">
          <header className="account-top">
            <div className="account-switch">
              {mode === "admin" ? <Link href="/tableau" aria-current="page">Espace Admin</Link> : <Link href="/compte" aria-current="page">Mon compte</Link>}
              <Link href="/">Librairie en ligne</Link>
              {mode === "client" ? <Link href="/tableau">Espace gérant</Link> : null}
            </div>
            <form className="account-search" onSubmit={onSearch}>
              <Search aria-hidden="true" />
              <input name="q" type="search" placeholder={mode === "admin" ? "Rechercher un produit, une commande…" : "Rechercher un livre, un thème…"} aria-label="Rechercher" />
            </form>
            <div className="account-user">
              <button type="button" className="account-bell" aria-label="Notifications" aria-expanded={notes} onClick={() => setNotes((open) => !open)}>
                <Bell aria-hidden="true" />
              </button>
              {notes ? <p className="account-notes">Aucune notification. Démonstration.</p> : null}
              <span className="account-id">
                <UserRound aria-hidden="true" />
                <span><strong>{display}</strong><small>{role}</small></span>
              </span>
            </div>
          </header>
          <div className="account-body">{children}</div>
        </div>
      </div>
    </SpaceContext.Provider>
    </AccountContext.Provider>
  );
}
