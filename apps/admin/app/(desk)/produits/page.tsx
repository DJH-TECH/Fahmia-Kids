"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, eur, xof } from "@/lib/api";
import { statusLabel, typeLabel } from "@/lib/labels";

type Row = {
  id: string; title: string; type: string; priceEur: number; priceXof: number; stock: number;
  status: string; isDemo: boolean; hiddenOnShop: boolean;
};

export default function Products() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    api<Row[]>("/api/products").then(setRows).catch((error: Error) => setMessage(error.message));
  }
  useEffect(load, []);
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
  }, []);

  async function remove(id: string) {
    if (!confirm("Retirer ce produit du catalogue ?")) return;
    await api(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="head">
        <h2>Produits</h2>
        <Button asChild><Link href="/produits/nouveau">Créer un produit</Link></Button>
      </div>
      <p className="msg">{message}</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Produit</th><th>Type</th><th>Prix</th><th>Stock</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {rows.filter((row) => row.title.toLowerCase().includes(query.toLowerCase())).map((row) => (
              <tr key={row.id}>
                <td>
                  {row.title}{" "}
                  {row.isDemo && <Badge>Démo</Badge>}
                  {row.hiddenOnShop && <span className="meta"> · masqué (jeux)</span>}
                </td>
                <td>{typeLabel(row.type)}</td>
                <td>{eur(row.priceEur)}<br /><span className="meta">{xof(row.priceXof)}</span></td>
                <td>{row.stock}</td>
                <td>{statusLabel(row.status)}</td>
                <td className="row">
                  <Link href={`/produits/${row.id}`}>Modifier</Link>
                  <Button variant="ghost" type="button" onClick={() => remove(row.id)}>Retirer</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
