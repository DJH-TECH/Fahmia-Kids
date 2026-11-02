"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Media = { id: string; url: string };

export default function MediaPage() {
  const [rows, setRows] = useState<Media[]>([]);
  const [message, setMessage] = useState("");
  function load() { api<Media[]>("/api/media").then(setRows).catch((error: Error) => setMessage(error.message)); }
  useEffect(load, []);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const body = new FormData();
    Array.from(list).forEach((file) => body.append("files", file));
    try {
      await api("/api/media", { method: "POST", body });
      setMessage("");
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    }
  }

  return (
    <>
      <div className="head">
        <h2>Médiathèque</h2>
        <label className="btn">Importer des images
          <input type="file" accept="image/*" multiple hidden onChange={(event) => onFiles(event.target.files)} />
        </label>
      </div>
      <p className="meta">Ces images peuvent devenir la couverture d’un produit ou la photo de la bannière.</p>
      <p className="msg">{message}</p>
      <div className="media">
        {rows.map((row) => (
          <article key={row.id}>
            <img src={row.url} alt="" />
            <button className="btn-quiet" type="button" onClick={async () => { await api(`/api/media/${row.id}`, { method: "DELETE" }); load(); }}>Retirer</button>
          </article>
        ))}
      </div>
      {rows.length === 0 && <p className="meta">Aucune image importée.</p>}
    </>
  );
}
