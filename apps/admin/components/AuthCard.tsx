"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const reduce = useReducedMotion();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (mode === "signup" && password !== String(form.get("confirm") || "")) {
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      await api(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password }),
      });
      window.location.assign("/tableau");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connexion impossible.");
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-paper md:grid-cols-[minmax(280px,0.86fr)_1.14fr]">
      <aside className="flex flex-col gap-5 bg-gradient-to-br from-plum-hot to-[#431840] px-8 py-9 text-[#f6efe6]">
        <img src="/logo-mark.png" alt="Fahmia Kids" className="w-40 rounded-2xl bg-white p-1.5" />
        <div>
          <h2 className="max-w-[12ch] text-4xl text-white">Espace gérant</h2>
          <p className="mt-2 max-w-[34ch]">Le catalogue, les commandes et les pages de la boutique se règlent ici.</p>
          <ul className="mt-3 grid gap-2">
            {["Produits, stocks et promotions", "Commandes et avis", "Pages et photo de la bannière"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <span className="size-2 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Button variant="light" className="mt-auto self-start" asChild>
          <Link href="/">Voir la boutique</Link>
        </Button>
      </aside>
      <motion.div
        className="grid content-center px-8 py-10 md:px-12"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mb-4 flex gap-2">
          <Link href="/connexion" aria-current={mode === "login" ? "page" : undefined} className={cn("rounded-full border border-[#eadfd4] px-3.5 py-2 text-plum", mode === "login" && "border-plum-hot bg-plum-hot text-white")}>Connexion</Link>
          <Link href="/inscription" aria-current={mode === "signup" ? "page" : undefined} className={cn("rounded-full border border-[#eadfd4] px-3.5 py-2 text-plum", mode === "signup" && "border-plum-hot bg-plum-hot text-white")}>Inscription</Link>
        </div>
        <form className="grid max-w-md gap-3" onSubmit={onSubmit}>
          <h2 className="text-3xl text-plum-hot">{mode === "login" ? "Connexion" : "Inscription"}</h2>
          <p className="text-sm text-muted">
            {mode === "login"
              ? "Réservé au gérant. Compte de démonstration : gerant@fahmiakids.com · mot de passe demo."
              : "Le compte est enregistré sur le serveur de cette maquette. Aucun e-mail n’est envoyé."}
          </p>
          {mode === "signup" && <label className="grid gap-1 text-sm">Nom<Input name="name" autoComplete="name" required /></label>}
          <label className="grid gap-1 text-sm">E-mail<Input name="email" type="email" autoComplete="username" required /></label>
          <label className="grid gap-1 text-sm">Mot de passe<Input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          {mode === "signup" && <label className="grid gap-1 text-sm">Confirmer le mot de passe<Input name="confirm" type="password" autoComplete="new-password" required /></label>}
          <p className="min-h-5 text-sm text-danger" role="status">{message}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={pending}>{mode === "login" ? "Se connecter" : "Créer le compte"}</Button>
            {mode === "login" && (
              <Button variant="ghost" type="button" onClick={(event) => {
                const form = event.currentTarget.form;
                if (!form) return;
                (form.elements.namedItem("email") as HTMLInputElement).value = "gerant@fahmiakids.com";
                (form.elements.namedItem("password") as HTMLInputElement).value = "demo";
                setMessage("");
              }}>Utiliser le compte de démonstration</Button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
