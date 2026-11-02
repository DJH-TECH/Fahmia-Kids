"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, eur } from "@/lib/api";

type Country = { id: string; name: string; code: string; feeEur: number; feeXof: number; mobile: boolean };
type Settings = { name: string; tagline: string; phone: string; partners: string; eurEnabled: boolean; xofEnabled: boolean; bannerUrl: string | null };
type Partner = { name: string; logoUrl: string };

function readPartners(raw: string): Partner[] {
  const text = raw.trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const rows = JSON.parse(text) as { name?: string; logoUrl?: string }[];
      return rows
        .map((row) => ({ name: String(row.name || ""), logoUrl: String(row.logoUrl || "") }))
        .filter((row) => row.name || row.logoUrl);
    } catch {
      return [];
    }
  }
  return text.split("\n").map((name) => name.trim()).filter(Boolean).map((name) => ({ name, logoUrl: "" }));
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [message, setMessage] = useState("");
  const [partnerRows, setPartnerRows] = useState<Partner[]>([]);

  function load() {
    api<{ settings: Settings; countries: Country[] }>("/api/settings").then((data) => {
      setSettings(data.settings);
      setPartnerRows(readPartners(data.settings.partners));
      setCountries(data.countries);
    });
  }
  useEffect(load, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    const form = new FormData(event.currentTarget);
    const row = await api<Settings>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({
        name: form.get("name"),
        tagline: form.get("tagline"),
        phone: form.get("phone"),
        partners: JSON.stringify(partnerRows.map((row) => ({ name: row.name.trim(), logoUrl: row.logoUrl })).filter((row) => row.name)),
        eurEnabled: form.get("eur") === "on",
        xofEnabled: form.get("xof") === "on",
      }),
    });
    setSettings({ ...settings, ...row });
    setMessage("Réglages enregistrés.");
  }

  async function partnerLogo(index: number, file: File) {
    const body = new FormData();
    body.append("logo", file);
    const row = await api<{ logoUrl: string }>("/api/settings/partner-logo", { method: "POST", body });
    setPartnerRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, logoUrl: row.logoUrl } : item));
  }

  async function banner(file: File) {
    const body = new FormData();
    body.append("banner", file);
    const row = await api<{ bannerUrl: string }>("/api/settings/banner", { method: "POST", body });
    setSettings((current) => current ? { ...current, bannerUrl: row.bannerUrl } : current);
  }

  async function addCountry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/api/countries", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        code: form.get("code"),
        feeEur: form.get("feeEur"),
        feeXof: form.get("feeXof"),
        mobile: form.get("mobile") === "on",
      }),
    });
    event.currentTarget.reset();
    load();
  }

  async function reset() {
    if (!confirm("Revenir aux données de départ ? Les comptes créés ici seront effacés.")) return;
    await api("/api/settings/reset", { method: "POST" });
    window.location.assign("/connexion");
  }

  if (!settings) return <p>Chargement…</p>;

  return (
    <>
      <h2>Réglages de la boutique</h2>
      <p className={message ? "meta ok" : "meta"}>{message}</p>
      <div className="grid-2" style={{ marginTop: 12 }}>
        <form className="panel" onSubmit={save}>
          <h3>Identité</h3>
          <label className="field">Nom de la boutique<input name="name" type="text" defaultValue={settings.name} /></label>
          <label className="field">Phrase du tableau de bord<textarea name="tagline" defaultValue={settings.tagline} rows={3} /></label>
          <label className="field">Téléphone du service client<input name="phone" type="tel" defaultValue={settings.phone} /></label>
          <h3 style={{ marginTop: 16 }}>Liste des partenaires</h3>
          {partnerRows.map((partner, index) => (
            <div className="partner-edit" key={`${partner.logoUrl}-${index}`}>
              {partner.logoUrl ? <img src={partner.logoUrl} alt="" /> : <span />}
              <span>
                <input type="text" value={partner.name} aria-label="Nom du partenaire" onChange={(event) => setPartnerRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} />
                <label className="btn-line" style={{ display: "inline-block", marginTop: 6 }}>Logo
                  <input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) partnerLogo(index, file); }} />
                </label>
                <button className="btn-quiet" type="button" onClick={() => setPartnerRows((rows) => rows.filter((_, itemIndex) => itemIndex !== index))}>Retirer</button>
              </span>
            </div>
          ))}
          <button className="btn-line" type="button" style={{ marginTop: 8 }} onClick={() => setPartnerRows((rows) => [...rows, { name: "", logoUrl: "" }])}>Ajouter un partenaire</button>
          <p className="meta">Le logo et le nom s’affichent dans le pied de page, sous Contact.</p>
          <p className="meta">Aucune adresse et aucune ville. Le nom saisi remplace le titre du bandeau.</p>
          <h3 style={{ marginTop: 16 }}>Photo de la bannière</h3>
          {settings.bannerUrl && <img className="banner-preview" src={settings.bannerUrl} alt="Photo actuelle de la bannière" />}
          <p className="meta">Cette photo est celle de droite sur l’accueil, quand la vitrine sera branchée.</p>
          <label className="btn-line" style={{ display: "inline-block" }}>Choisir une photo
            <input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) banner(file); }} />
          </label>
          <h3 style={{ marginTop: 16 }}>Devises d’affichage</h3>
          <label className="check"><input name="eur" type="checkbox" defaultChecked={settings.eurEnabled} /> Euro</label>
          <label className="check"><input name="xof" type="checkbox" defaultChecked={settings.xofEnabled} /> Franc CFA</label>
          <button className="btn" type="submit" style={{ marginTop: 12 }}>Enregistrer les réglages</button>
        </form>
        <article className="panel">
          <h3>Pays de livraison</h3>
          {countries.map((country) => (
            <p key={country.id}>
              {country.name} · {eur(country.feeEur)} · {country.mobile ? "carte et mobile money" : "carte"}{" "}
              <button className="btn-quiet" type="button" onClick={async () => { await api(`/api/countries/${country.id}`, { method: "DELETE" }); load(); }}>Retirer</button>
            </p>
          ))}
          <form className="form" onSubmit={addCountry} style={{ padding: 0, border: 0 }}>
            <div className="grid-2">
              <label>Pays<input name="name" type="text" required /></label>
              <label>Code<input name="code" type="text" required /></label>
              <label>Frais euros<input name="feeEur" type="number" step="0.1" defaultValue={6} /></label>
              <label>Frais F CFA<input name="feeXof" type="number" step="100" defaultValue={4000} /></label>
            </div>
            <label className="check"><input name="mobile" type="checkbox" /> Proposer le mobile money</label>
            <button className="btn" type="submit">Ajouter le pays</button>
          </form>
        </article>
        <article className="panel">
          <h3>Paiement</h3>
          <p>Les moyens proposés au client viennent des pays activés ici. Sans clés marchandes, la validation reste une démonstration.</p>
          <button className="btn-line" type="button" onClick={reset}>Revenir aux données de départ</button>
        </article>
      </div>
    </>
  );
}
