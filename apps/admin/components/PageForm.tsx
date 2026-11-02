"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export type PageDoc = { id: string; title: string; slug: string; body: string; status: string; isDemo: boolean };

export function PageForm({ initial }: { initial?: PageDoc }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"),
      slug: form.get("slug"),
      body: form.get("body"),
      status: form.get("status"),
      isDemo: form.get("isDemo") === "on",
    };
    try {
      if (initial) await api(`/api/pages/${initial.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/api/pages", { method: "POST", body: JSON.stringify(payload) });
      router.push("/pages");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>Titre<input name="title" type="text" defaultValue={initial?.title} required /></label>
      <label>Adresse<input name="slug" type="text" defaultValue={initial?.slug} placeholder="/comment-choisir" required /></label>
      <label>Texte<textarea name="body" defaultValue={initial?.body} /></label>
      <label>Statut
        <select name="status" defaultValue={initial?.status || "draft"}>
          <option value="draft">Brouillon</option>
          <option value="published">Publiée</option>
        </select>
      </label>
      <label className="check"><input name="isDemo" type="checkbox" defaultChecked={initial?.isDemo ?? true} /> Donnée de démonstration</label>
      <p className="msg" role="status">{message}</p>
      <button className="btn" type="submit">Enregistrer la page</button>
    </form>
  );
}
