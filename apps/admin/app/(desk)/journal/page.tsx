"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/labels";

type Article = { id: string; title: string; excerpt: string; body: string; status: string; isDemo: boolean };

export default function Journal() {
  const [rows, setRows] = useState<Article[]>([]);
  const [message, setMessage] = useState("");
  function load() { api<Article[]>("/api/articles").then(setRows); }
  useEffect(load, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/articles", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          excerpt: form.get("excerpt"),
          body: form.get("body"),
          status: form.get("status"),
          isDemo: true,
        }),
      });
      event.currentTarget.reset();
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    }
  }

  return (
    <>
      <h2>Journal</h2>
      <p className="meta">Articles de démonstration. Ils seront lus sur la vitrine quand elle sera branchée.</p>
      <form className="form" onSubmit={onSubmit}>
        <label>Titre<input name="title" type="text" required /></label>
        <label>Accroche<input name="excerpt" type="text" /></label>
        <label>Texte<textarea name="body" /></label>
        <label>Statut
          <select name="status" defaultValue="draft"><option value="draft">Brouillon</option><option value="published">Publié</option></select>
        </label>
        <p className="msg">{message}</p>
        <button className="btn" type="submit">Enregistrer l’article</button>
      </form>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Article</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title} {row.isDemo && <span className="demo">Démo</span>}<br /><span className="meta">{row.excerpt}</span></td>
                <td>{statusLabel(row.status)}</td>
                <td><button className="btn-quiet" type="button" onClick={async () => { await api(`/api/articles/${row.id}`, { method: "DELETE" }); load(); }}>Retirer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
