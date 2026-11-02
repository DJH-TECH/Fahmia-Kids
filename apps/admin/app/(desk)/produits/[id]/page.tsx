"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Product, ProductForm } from "@/components/ProductForm";
import { api } from "@/lib/api";

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<Product>(`/api/products/${id}`).then(setProduct).catch((error: Error) => setMessage(error.message));
  }, [id]);
  if (!product) return <p>{message || "Chargement…"}</p>;
  return (<><h2>Modifier le produit</h2><div style={{ height: 12 }} /><ProductForm initial={product} /></>);
}
