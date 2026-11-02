"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Item = { id: string; name: string; blurb: string; startsOn: string; endsOn: string; active: boolean; isDemo: boolean };

export default function Collections() {
  const [rows, setRows] = useState<Item[]>([]);
  const [message, setMessage] = useState("");
  function load() { api<Item[]>("/api/collections").then(setRows); }
  useEffect(load, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/collections", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          blurb: form.get("blurb"),
          startsOn: form.get("startsOn"),
          endsOn: form.get("endsOn"),
          active: true,
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
      <h2>Collections</h2>
      <p className="meta">Sélections datées, par exemple Ramadan ou Aïd. Les dates se règlent ici.</p>
      <form className="form" onSubmit={onSubmit}>
        <div className="grid-2">
          <label>Nom<input name="name" type="text" required /></label>
          <label>Texte court<input name="blurb" type="text" /></label>
          <label>Début<input name="startsOn" type="date" required /></label>
          <label>Fin<input name="endsOn" type="date" required /></label>
        </div>
        <p className="msg">{message}</p>
        <button className="btn" type="submit">Enregistrer la collection</button>
      </form>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Collection</th><th>Du</th><th>Au</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name} {row.isDemo && <span className="demo">Démo</span>}<br /><span className="meta">{row.blurb}</span></td>
                <td>{row.startsOn}</td>
                <td>{row.endsOn}</td>
                <td><button className="btn-quiet" type="button" onClick={async () => { await api(`/api/collections/${row.id}`, { method: "DELETE" }); load(); }}>Retirer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
