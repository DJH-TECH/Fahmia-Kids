"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageDoc, PageForm } from "@/components/PageForm";
import { api } from "@/lib/api";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<PageDoc | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<PageDoc>(`/api/pages/${id}`).then(setPage).catch((error: Error) => setMessage(error.message));
  }, [id]);
  if (!page) return <p>{message || "Chargement…"}</p>;
  return (<><h2>Modifier la page</h2><div style={{ height: 12 }} /><PageForm initial={page} /></>);
}
