"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Profile = { name: string; email: string; isDemo?: boolean };
type Customer = { id: string; name: string; email: string; phone: string; _count: { favorites: number; addresses: number; orders: number } };

export default function Clients() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api<Profile>("/api/auth/me").then(setProfile).catch(() => setProfile(null));
    api<Customer[]>("/api/customers").then(setCustomers).catch(() => setCustomers([]));
  }, []);

  return (
    <>
      <h2>Clients</h2>
      <p className="meta">Les comptes parents se créent quand quelqu’un ouvre Mon compte. Les favoris et les adresses viennent de leur espace.</p>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>Favoris</th><th>Adresses</th><th>Commandes</th></tr></thead>
          <tbody>
            {profile && (
              <tr>
                <td>{profile.name} {profile.isDemo && <span className="demo">Démo</span>}</td>
                <td>{profile.email}</td>
                <td>—</td>
                <td colSpan={3}>Administrateur · <Link href="/tableau">espace gérant</Link></td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name || "Compte client"}</td>
                <td>{customer.email || "—"}</td>
                <td>{customer.phone || "—"}</td>
                <td>{customer._count.favorites}</td>
                <td>{customer._count.addresses}</td>
                <td>{customer._count.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {customers.length === 0 && <p className="meta">Aucun compte parent pour le moment.</p>}
      <article className="panel" id="roles" style={{ marginTop: 16 }}>
        <h3>Rôles</h3>
        <p className="meta">L’administrateur gère le catalogue, les commandes, les stocks et les réglages. Le compte client ne voit que ses commandes, ses favoris et ses adresses.</p>
        <p><Link href="/compte">Ouvrir le compte client</Link></p>
      </article>
    </>
  );
}
