"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AGES, TYPES } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";

export type Product = {
  id: string;
  title: string;
  type: string;
  blurb: string;
  description: string;
  advice: string;
  author: string;
  priceEur: number;
  priceXof: number;
  compareEur: number | null;
  stock: number;
  ageBand: string;
  status: string;
  isDemo: boolean;
  imageUrl: string | null;
  categoryId: string | null;
};

type Category = { id: string; name: string };

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<Category[]>("/api/categories")
      .then(setCategories)
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setReady(true));
  }, []);

  async function onImage(file: File) {
    const body = new FormData();
    body.append("files", file);
    const [media] = await api<{ url: string }[]>("/api/media", { method: "POST", body });
    setImageUrl(media.url);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const compare = String(form.get("compareEur") || "");
    const payload = {
      title: form.get("title"),
      type: form.get("type"),
      blurb: form.get("blurb"),
      description: form.get("description"),
      advice: form.get("advice"),
      author: form.get("author"),
      priceEur: form.get("priceEur"),
      priceXof: form.get("priceXof"),
      compareEur: compare === "" ? null : Number(compare),
      stock: form.get("stock"),
      ageBand: form.get("ageBand"),
      status: form.get("status"),
      categoryId: String(form.get("categoryId") || "") || null,
      imageUrl: imageUrl || null,
      isDemo: form.get("isDemo") === "on",
    };
    setPending(true);
    setMessage("");
    try {
      if (initial) await api(`/api/products/${initial.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/api/products", { method: "POST", body: JSON.stringify(payload) });
      router.push("/produits");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
      setPending(false);
    }
  }

  if (!ready) return <p>{message || "Chargement…"}</p>;

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="grid-2">
        <label>Titre<Input name="title" defaultValue={initial?.title} required /></label>
        <label>Type
          <NativeSelect name="type" defaultValue={initial?.type || "BOOK"}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect>
        </label>
      </div>
      <label>Description courte<Textarea name="blurb" defaultValue={initial?.blurb} placeholder="Ce que l’enfant va lire ou faire." /></label>
      <label>Description<Textarea name="description" defaultValue={initial?.description} placeholder="Le texte affiché sur la fiche du livre." /></label>
      <label>Conseil aux parents<Textarea name="advice" defaultValue={initial?.advice} placeholder="Comment lire ce titre ensemble." /></label>
      <div className="grid-2">
        <label>Prix euros<Input name="priceEur" type="number" step="0.01" min="0" defaultValue={initial?.priceEur ?? 14.9} /></label>
        <label>Prix F CFA<Input name="priceXof" type="number" step="1" min="0" defaultValue={initial?.priceXof ?? 9800} /></label>
        <label>Prix barré euros<Input name="compareEur" type="number" step="0.01" min="0" defaultValue={initial?.compareEur ?? ""} placeholder="Optionnel" /></label>
        <label>Stock<Input name="stock" type="number" step="1" min="0" defaultValue={initial?.stock ?? 12} /></label>
        <label>Âge
          <NativeSelect name="ageBand" defaultValue={initial?.ageBand || "6-8"}>{AGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect>
        </label>
        <label>Catégorie
          <NativeSelect name="categoryId" defaultValue={initial?.categoryId || ""}>
            <option value="">Aucune</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </NativeSelect>
        </label>
        <label>Auteur<Input name="author" defaultValue={initial?.author} /></label>
        <label>Statut
          <NativeSelect name="status" defaultValue={initial?.status || "draft"}>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </NativeSelect>
        </label>
      </div>
      <label className="check"><input name="isDemo" type="checkbox" defaultChecked={initial?.isDemo ?? true} /> Donnée de démonstration</label>
      <div>
        <p className="meta">Couverture</p>
        {imageUrl && <img src={imageUrl} alt="" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12 }} />}
        <label className="btn-line" style={{ display: "inline-block", marginTop: 8 }}>Choisir une image
          <input type="file" accept="image/*" hidden onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImage(file).catch((error: Error) => setMessage(error.message));
          }} />
        </label>
      </div>
      <p className="meta">Le produit reste en brouillon tant qu’il n’est pas publié. Les prix de départ sont fictifs.</p>
      <p className="msg" role="status">{message}</p>
      <Button type="submit" disabled={pending}>Enregistrer le produit</Button>
    </form>
  );
}
