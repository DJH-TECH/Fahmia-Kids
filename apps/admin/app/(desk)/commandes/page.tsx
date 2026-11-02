"use client";

import { useEffect, useState } from "react";
import { api, eur } from "@/lib/api";
import { statusLabel } from "@/lib/labels";

type Line = { title: string; qty: number; priceEur: number };
type Order = { id: string; number: string; destination: string; totalEur: number; payment: string; status: string; isDemo: boolean; lines: Line[] };

export default function Orders() {
  const [rows, setRows] = useState<Order[]>([]);
  const [open, setOpen] = useState<Order | null>(null);
  function load() { api<Order[]>("/api/orders").then(setRows); }
  useEffect(load, []);

  async function change(id: string, status: string) {
    await api(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
    setOpen((current) => current && current.id === id ? { ...current, status } : current);
  }

  return (
    <>
      <h2>Commandes</h2>
      <p className="meta">Aucun paiement réel. Chaque ligne indique une démonstration.</p>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Numéro</th><th>Destination</th><th>Total</th><th>Paiement</th><th>Statut</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => setOpen(row)} style={{ cursor: "pointer" }}>
                <td>{row.number} {row.isDemo && <span className="demo">Démo</span>}</td>
                <td>{row.destination}</td>
                <td>{eur(row.totalEur)}</td>
                <td>{row.payment}</td>
                <td>{statusLabel(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="meta">Aucune commande.</p>}
      {open && (
        <article className="panel" style={{ marginTop: 12 }}>
          <h3>{open.number}</h3>
          <p className="meta">{open.destination} · {open.payment}</p>
          <ul>{open.lines.map((line) => <li key={line.title}>{line.title} · {line.qty} · {eur(line.priceEur)}</li>)}</ul>
          <label>Statut
            <select value={open.status} onChange={(event) => change(open.id, event.target.value)}>
              <option value="a_preparer">À préparer</option>
              <option value="expediee">Expédiée</option>
              <option value="livree">Livrée</option>
            </select>
          </label>
        </article>
      )}
    </>
  );
}
