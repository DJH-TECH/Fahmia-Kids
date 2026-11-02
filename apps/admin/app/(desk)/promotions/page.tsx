"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Promo = { id: string; name: string; percent: number; preview: string; isDemo: boolean };
type Category = { id: string; name: string };
type Product = { id: string; title: string };

export default function Promotions() {
  const [rows, setRows] = useState<Promo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  function load() { api<Promo[]>("/api/promotions").then(setRows); }
  useEffect(() => {
    load();
    api<Category[]>("/api/categories").then(setCategories);
    api<Product[]>("/api/products").then(setProducts);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/promotions", {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), percent: form.get("percent"), scope: form.get("scope") }),
      });
      setMessage("Promotion de démonstration enregistrée.");
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    }
  }

  return (
    <>
      <h2>Promotions</h2>
      <form className="form" onSubmit={onSubmit}>
        <div className="grid-2">
          <label>Nom<input name="name" type="text" defaultValue="Collection Ramadan" required /></label>
          <label>Pourcentage<input name="percent" type="number" min="1" max="80" defaultValue={15} required /></label>
          <label>Portée
            <select name="scope" defaultValue="all">
              <option value="all">Tout le catalogue</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              {products.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}
            </select>
          </label>
        </div>
        <p className={message.startsWith("Promotion") ? "meta ok" : "msg"}>{message}</p>
        <button className="btn" type="submit">Enregistrer la promotion de démonstration</button>
      </form>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Règle</th><th>Détail du prix</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name} · −{row.percent} % {row.isDemo && <span className="demo">Démo</span>}</td>
                <td>{row.preview}</td>
                <td><button className="btn-quiet" type="button" onClick={async () => { await api(`/api/promotions/${row.id}`, { method: "DELETE" }); load(); }}>Retirer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
