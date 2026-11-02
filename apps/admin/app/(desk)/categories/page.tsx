"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Category = { id: string; name: string; parent: string; products: number; visible: boolean; isGames: boolean };

export default function Categories() {
  const [rows, setRows] = useState<Category[]>([]);
  const [message, setMessage] = useState("");

  function load() { api<Category[]>("/api/categories").then(setRows).catch((error: Error) => setMessage(error.message)); }
  useEffect(load, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), parent: form.get("parent"), isGames: form.get("isGames") === "on" }),
      });
      event.currentTarget.reset();
      setMessage("");
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ajout impossible.");
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/categories/${id}`, { method: "DELETE" });
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Suppression impossible.");
    }
  }

  return (
    <>
      <h2>Catégories</h2>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: 12 }}>
        <div className="grid-2">
          <label>Nom<input name="name" type="text" required /></label>
          <label>Parent
            <select name="parent" defaultValue="Livres">
              <option>Aucune</option><option>Livres</option><option>Coffrets</option>
            </select>
          </label>
        </div>
        <label className="check"><input name="isGames" type="checkbox" /> Rayon jeux et activités, masqué tant que le réglage est coupé</label>
        <p className="msg">{message}</p>
        <button className="btn" type="submit">Ajouter la catégorie</button>
      </form>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Catégorie</th><th>Parent</th><th>Produits</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name} {row.isGames && <span className="demo">Jeux</span>}</td>
                <td>{row.parent}</td>
                <td>{row.products}</td>
                <td><button className="btn-quiet" type="button" onClick={() => remove(row.id)}>Retirer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
