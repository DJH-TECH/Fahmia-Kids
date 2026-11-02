"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/labels";

type Row = { id: string; title: string; slug: string; status: string; isDemo: boolean };

export default function Pages() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { api<Row[]>("/api/pages").then(setRows); }, []);
  return (
    <>
      <div className="head"><h2>Pages</h2><Link className="btn" href="/pages/nouveau">Créer une page</Link></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Page</th><th>Adresse</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title} {row.isDemo && <span className="demo">Démo</span>}</td>
                <td>{row.slug}</td>
                <td>{statusLabel(row.status)}</td>
                <td><Link href={`/pages/${row.id}`}>Modifier</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
