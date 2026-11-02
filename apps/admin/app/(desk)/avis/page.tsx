"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/labels";

type Review = { id: string; body: string; authorName: string; status: string; isDemo: boolean; productTitle: string };

export default function Reviews() {
  const [rows, setRows] = useState<Review[]>([]);
  function load() { api<Review[]>("/api/reviews").then(setRows); }
  useEffect(load, []);

  async function setStatus(id: string, status: string) {
    await api(`/api/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <>
      <h2>Avis</h2>
      <p className="meta">Les avis de démonstration ne comptent pas comme des avis clients réels. Ils restent marqués.</p>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {rows.map((row) => (
          <article className="panel" key={row.id}>
            <p>{row.body}</p>
            <p className="meta">{row.authorName} · {row.productTitle} · {statusLabel(row.status)} {row.isDemo && <span className="demo">Démo</span>}</p>
            <div className="row">
              <button className="btn" type="button" onClick={() => setStatus(row.id, "published")}>Publier</button>
              <button className="btn-line" type="button" onClick={() => setStatus(row.id, "hidden")}>Masquer</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
