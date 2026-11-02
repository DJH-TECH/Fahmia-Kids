const scenes: Record<string, string> = {
  coran: `<svg viewBox="0 0 160 210"><rect width="160" height="210" fill="#1f6b4a"/><rect x="28" y="36" width="104" height="130" rx="6" fill="#f4e2b0"/><text x="80" y="108" text-anchor="middle" font-size="28" fill="#1f6b4a" font-family="Georgia">اقرأ</text><path d="M20 170h120" stroke="#e7c56a" stroke-width="3"/></svg>`,
  prophetes: `<svg viewBox="0 0 160 210"><rect width="160" height="210" fill="#2f6f8f"/><circle cx="120" cy="42" r="16" fill="#f0d48a"/><path d="M20 150 L50 110 L80 150 L110 96 L150 150 V210 H20z" fill="#1d4e3a"/><rect x="70" y="118" width="22" height="40" fill="#f4e2b0"/></svg>`,
  arabe: `<svg viewBox="0 0 160 210"><rect width="160" height="210" fill="#0e6e8a"/><text x="80" y="120" text-anchor="middle" font-size="64" fill="#f7e7a8" font-family="Georgia">أ ب</text></svg>`,
  valeurs: `<svg viewBox="0 0 160 210"><rect width="160" height="210" fill="#6a3d78"/><circle cx="46" cy="90" r="18" fill="#f2c14e"/><circle cx="80" cy="78" r="18" fill="#7ec8c3"/><circle cx="114" cy="90" r="18" fill="#e7a0b4"/><rect x="36" y="120" width="88" height="50" rx="8" fill="#f7efe4"/></svg>`,
  contes: `<svg viewBox="0 0 160 210"><rect width="160" height="210" fill="#24345c"/><path d="M80 28c18 20 18 40 0 52-18-12-18-32 0-52z" fill="#f0d48a"/><rect x="70" y="80" width="20" height="70" rx="4" fill="#c9842a"/><circle cx="30" cy="40" r="4" fill="#fff"/><circle cx="130" cy="56" r="3" fill="#fff"/></svg>`,
  jeux: `<svg viewBox="0 0 160 210"><rect width="160" height="210" fill="#f7efe4"/><rect x="28" y="40" width="46" height="46" rx="8" fill="#7c4dff"/><rect x="84" y="40" width="46" height="46" rx="8" fill="#1c7f7b"/><rect x="28" y="98" width="46" height="46" rx="8" fill="#e39b3a"/><rect x="84" y="98" width="46" height="46" rx="8" fill="#d4527a"/></svg>`,
  cadeaux: `<svg viewBox="0 0 160 210"><rect width="160" height="210" fill="#f8e7ef"/><rect x="36" y="70" width="88" height="80" rx="8" fill="#d4527a"/><path d="M36 102h88M80 70v80" stroke="#f7efe4" stroke-width="8"/><path d="M80 70c-14-18-28-8-16 6M80 70c14-18 28-8 16 6" fill="none" stroke="#e39b3a" stroke-width="4"/></svg>`,
};

export function coverTheme(key?: string) {
  if (key && scenes[key]) return key;
  return "prophetes";
}

export function CoverArt({ theme }: { theme: string }) {
  return <span className="cover-art" dangerouslySetInnerHTML={{ __html: scenes[coverTheme(theme)] || scenes.prophetes }} />;
}
