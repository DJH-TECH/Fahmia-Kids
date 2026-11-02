"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Row = { id: string; title: string; stock: number; lowStock: number; level: string; isDemo: boolean };

const levelLabel = { rupture: "Rupture", bas: "Bas", ok: "Correct" };

export default function Stocks() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { api<Row[]>("/api/stocks").then(setRows); }, []);

  function edit(id: string, patch: Partial<Row>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  async function save(row: Row) {
    try {
      await api(`/api/stocks/${row.id}`, { method: "PATCH", body: JSON.stringify({ stock: row.stock, lowStock: row.lowStock }) });
      setMessage(`${row.title} : stock enregistré.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    }
  }

  return (
    <>
      <h2>Stocks</h2>
      <p className={message ? "meta ok" : "meta"}>{message || "Les quantités de départ sont fictives."}</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Produit</th><th>Disponible</th><th>Seuil</th><th>Niveau</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title} {row.isDemo && <span className="demo">Démo</span>}</td>
                <td><input type="number" min="0" value={row.stock} onChange={(event) => edit(row.id, { stock: Number(event.target.value) })} /></td>
                <td><input type="number" min="0" value={row.lowStock} onChange={(event) => edit(row.id, { lowStock: Number(event.target.value) })} /></td>
                <td>{levelLabel[(row.stock === 0 ? "rupture" : row.stock <= row.lowStock ? "bas" : "ok")]}</td>
                <td><button className="btn" type="button" onClick={() => save(row)}>Enregistrer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
