import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextFunction, Request, RequestHandler, Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "./prisma";
import { resetDemo } from "./seed-data";
import { checkPassword, clearClientCookie, clearSessionCookie, currentUser, hashPassword, readClientId, setClientCookie, startSession } from "./session";

export const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");

function patchAsync(router: Router) {
  for (const method of ["get", "post", "patch", "delete"] as const) {
    const original = router[method].bind(router);
    router[method] = ((pathName: string, ...handlers: RequestHandler[]) => original(pathName, ...handlers.map((handler) => {
      if (handler.length >= 4) return handler;
      const wrapped: RequestHandler = (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
      };
      return wrapped;
    }))) as typeof router.get;
  }
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "element";
}

function eur(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

const productSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  type: z.enum(["BOOK", "GAME", "ACTIVITY", "PACK", "GIFT_BOX"]),
  blurb: z.string().optional().default(""),
  description: z.string().optional().default(""),
  advice: z.string().optional().default(""),
  author: z.string().optional().default(""),
  priceEur: z.coerce.number().min(0),
  priceXof: z.coerce.number().int().min(0),
  compareEur: z.union([z.coerce.number().min(0), z.null()]).optional(),
  stock: z.coerce.number().int().min(0),
  lowStock: z.coerce.number().int().min(0).optional(),
  ageBand: z.enum(["3-5", "6-8", "9-12"]),
  status: z.enum(["draft", "published"]),
  categoryId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isDemo: z.boolean().optional(),
});

function productData(body: z.infer<typeof productSchema>) {
  return {
    title: body.title,
    type: body.type,
    blurb: body.blurb,
    description: body.description,
    advice: body.advice,
    author: body.author,
    priceEur: body.priceEur,
    priceXof: body.priceXof,
    compareEur: body.compareEur ?? null,
    stock: body.stock,
    lowStock: body.lowStock ?? 5,
    ageBand: body.ageBand,
    status: body.status,
    categoryId: body.categoryId || null,
    imageUrl: body.imageUrl || null,
    isDemo: body.isDemo ?? true,
  };
}

async function shop() {
  return prisma.setting.findUnique({ where: { id: "shop" } });
}

function presentProduct(product: {
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
  lowStock: number;
  ageBand: string;
  status: string;
  isDemo: boolean;
  imageUrl: string | null;
  categoryId: string | null;
  category: { name: string; isGames: boolean; key?: string } | null;
  createdAt: Date;
}, games: boolean) {
  return {
    id: product.id,
    title: product.title,
    type: product.type,
    blurb: product.blurb,
    description: product.description,
    advice: product.advice,
    author: product.author,
    priceEur: product.priceEur,
    priceXof: product.priceXof,
    compareEur: product.compareEur,
    stock: product.stock,
    lowStock: product.lowStock,
    ageBand: product.ageBand,
    status: product.status,
    isDemo: product.isDemo,
    imageUrl: product.imageUrl,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? "",
    hiddenOnShop: Boolean(product.category?.isGames && !games),
    createdAt: product.createdAt,
  };
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown, res: Response): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Données invalides." });
    return null;
  }
  return parsed.data;
}

export function upload() {
  fs.mkdirSync(uploadsDir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".img";
        cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
      },
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Choisissez une image."));
    },
  });
}

export function mountAuth(router: Router) {
  patchAsync(router);
  router.post("/login", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await checkPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
      return;
    }
    await startSession(res, user.id);
    res.json({ id: user.id, name: user.name, email: user.email, isDemo: user.isDemo });
  });

  router.post("/signup", async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (name.length < 2) {
      res.status(400).json({ error: "Indiquez le nom." });
      return;
    }
    if (!email.includes("@")) {
      res.status(400).json({ error: "Indiquez un e-mail valide." });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ error: "Le mot de passe doit faire au moins 4 caractères." });
      return;
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.status(409).json({ error: "Cet e-mail est déjà utilisé." });
      return;
    }
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password), isDemo: true, role: "ADMIN" },
    });
    await startSession(res, user.id);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, isDemo: user.isDemo });
  });

  router.post("/logout", async (req, res) => {
    const user = await currentUser(req);
    if (user) await prisma.session.deleteMany({ where: { userId: user.id } });
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  router.get("/me", async (req, res) => {
    const user = await currentUser(req);
    if (!user) {
      res.status(401).json({ error: "Connexion requise." });
      return;
    }
    res.json(user);
  });
}

export function mountApi(router: Router, files: ReturnType<typeof upload>) {
  patchAsync(router);
  router.get("/dashboard", async (_req, res) => {
    const settings = await shop();
    const [toPrepare, publishedProducts, pendingReviews, orders, products, countries] = await Promise.all([
      prisma.order.count({ where: { status: "a_preparer" } }),
      prisma.product.count({ where: { status: "published" } }),
      prisma.review.count({ where: { status: "pending" } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.product.findMany({ where: { status: "published" }, include: { category: true } }),
      prisma.country.findMany(),
    ]);
    const visible = products.filter((product) => settings?.games || !product.category?.isGames);
    const euroSum = visible.reduce((sum, product) => sum + product.priceEur, 0);
    const rate = euroSum > 0 ? visible.reduce((sum, product) => sum + product.priceXof, 0) / euroSum : 656;
    const byTitle = new Map(visible.map((product) => [product.title, product]));
    const lineXof = (title: string, priceEur: number, qty: number) => {
      const product = byTitle.get(title);
      if (product && product.priceEur > 0) return Math.round(priceEur * qty * (product.priceXof / product.priceEur));
      const country = countries.find((item) => title.includes(item.name));
      if (country) return country.feeXof * qty;
      return Math.round(priceEur * qty * rate);
    };
    const readLines = (linesJson: string) => {
      try {
        const parsed = JSON.parse(linesJson);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((line) => ({
          title: String(line?.title || ""),
          qty: Number(line?.qty) || 1,
          priceEur: Number(line?.priceEur) || 0,
        }));
      } catch {
        return [];
      }
    };
    const revenueEur = orders.reduce((sum, order) => sum + order.totalEur, 0);
    const sold = new Map<string, number>();
    const categories = new Map<string, { name: string; key: string; count: number }>();
    let revenueXof = 0;
    for (const order of orders) {
      const lines = readLines(order.linesJson);
      if (lines.length === 0) revenueXof += Math.round(order.totalEur * rate);
      for (const line of lines) {
        revenueXof += lineXof(line.title, line.priceEur, line.qty);
        const product = byTitle.get(line.title);
        if (!product) continue;
        sold.set(line.title, (sold.get(line.title) || 0) + line.qty);
        const key = product.category?.key || "autre";
        const current = categories.get(key) || { name: product.category?.name || "Autres", key, count: 0 };
        current.count += line.qty;
        categories.set(key, current);
      }
    }
    const series = Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setHours(12, 0, 0, 0);
      day.setDate(day.getDate() - (6 - index));
      const key = day.toISOString().slice(0, 10);
      const totalEur = orders
        .filter((order) => order.createdAt.toISOString().slice(0, 10) === key)
        .reduce((sum, order) => sum + order.totalEur, 0);
      return { day: key, label: day.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), totalEur };
    });
    const statusCount = (status: string) => orders.filter((order) => order.status === status).length;
    res.json({
      orders: orders.length,
      toPrepare,
      publishedProducts,
      pendingReviews,
      games: settings?.games ?? false,
      shopName: settings?.name ?? "Fahmia Kids",
      tagline: settings?.tagline ?? "",
      phone: settings?.phone ?? "",
      revenueEur,
      revenueXof,
      averageEur: orders.length ? revenueEur / orders.length : 0,
      averageXof: orders.length ? Math.round(revenueXof / orders.length) : 0,
      series,
      categories: [...categories.values()],
      statuses: [
        { key: "a_preparer", label: "En préparation", count: statusCount("a_preparer") },
        { key: "expediee", label: "Expédiée", count: statusCount("expediee") },
        { key: "livree", label: "Livrée", count: statusCount("livree") },
      ],
      recent: orders.slice(0, 4).map((order) => ({
        id: order.id,
        number: order.number,
        destination: order.destination,
        payment: order.payment,
        status: order.status,
        isDemo: order.isDemo,
        totalEur: order.totalEur,
        totalXof: readLines(order.linesJson).reduce((sum, line) => sum + lineXof(line.title, line.priceEur, line.qty), 0) || Math.round(order.totalEur * rate),
        createdAt: order.createdAt,
      })),
      top: [...visible]
        .map((product) => ({
          id: product.id,
          title: product.title,
          ageBand: product.ageBand,
          priceEur: product.priceEur,
          priceXof: product.priceXof,
          categoryKey: product.category?.key || "prophetes",
          sold: sold.get(product.title) || 0,
        }))
        .filter((product) => product.sold > 0)
        .sort((a, b) => b.sold - a.sold || a.title.localeCompare(b.title, "fr"))
        .slice(0, 5),
    });
  });

  router.get("/products", async (_req, res) => {
    const settings = await shop();
    const rows = await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });
    res.json(rows.map((row) => presentProduct(row, settings?.games ?? false)));
  });

  router.get("/products/:id", async (req, res) => {
    const settings = await shop();
    const row = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: true } });
    if (!row) {
      res.status(404).json({ error: "Produit introuvable." });
      return;
    }
    res.json(presentProduct(row, settings?.games ?? false));
  });

  router.post("/products", async (req, res) => {
    const body = parseBody(productSchema, req.body, res);
    if (!body) return;
    const settings = await shop();
    const row = await prisma.product.create({ data: productData(body), include: { category: true } });
    res.status(201).json(presentProduct(row, settings?.games ?? false));
  });

  router.patch("/products/:id", async (req, res) => {
    const body = parseBody(productSchema, req.body, res);
    if (!body) return;
    const settings = await shop();
    try {
      const row = await prisma.product.update({
        where: { id: req.params.id },
        data: productData(body),
        include: { category: true },
      });
      res.json(presentProduct(row, settings?.games ?? false));
    } catch {
      res.status(404).json({ error: "Produit introuvable." });
    }
  });

  router.delete("/products/:id", async (req, res) => {
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Produit introuvable." });
    }
  });

  router.get("/categories", async (_req, res) => {
    const rows = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } });
    res.json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      key: row.key,
      parent: row.parent,
      isGames: row.isGames,
      visible: row.visible,
      products: row._count.products,
    })));
  });

  router.post("/categories", async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const parent = String(req.body?.parent || "Livres");
    const isGames = Boolean(req.body?.isGames);
    if (!name) {
      res.status(400).json({ error: "Le nom est obligatoire." });
      return;
    }
    const keyBase = slugify(name);
    let key = keyBase;
    let n = 2;
    while (await prisma.category.findUnique({ where: { key } })) {
      key = `${keyBase}-${n++}`;
    }
    const row = await prisma.category.create({ data: { name, key, parent, isGames, visible: true } });
    res.status(201).json(row);
  });

  router.delete("/categories/:id", async (req, res) => {
    const count = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      res.status(409).json({ error: "Cette catégorie a encore des produits." });
      return;
    }
    try {
      await prisma.category.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Catégorie introuvable." });
    }
  });

  router.get("/media", async (_req, res) => {
    res.json(await prisma.media.findMany({ orderBy: { createdAt: "desc" } }));
  });

  router.post("/media", files.array("files", 12), async (req, res) => {
    const list = (req.files as Express.Multer.File[]) || [];
    if (!list.length) {
      res.status(400).json({ error: "Aucune image reçue." });
      return;
    }
    const created = await Promise.all(list.map((file) => prisma.media.create({
      data: { filename: file.filename, url: `/uploads/${file.filename}` },
    })));
    res.status(201).json(created);
  });

  router.delete("/media/:id", async (req, res) => {
    const row = await prisma.media.findUnique({ where: { id: req.params.id } });
    if (!row) {
      res.status(404).json({ error: "Image introuvable." });
      return;
    }
    await prisma.media.delete({ where: { id: row.id } });
    fs.rm(path.join(uploadsDir, row.filename), { force: true }, () => undefined);
    res.json({ ok: true });
  });

  const pageSchema = z.object({
    title: z.string().trim().min(1, "Le titre est obligatoire."),
    slug: z.string().trim().min(1, "L’adresse est obligatoire."),
    body: z.string().optional().default(""),
    status: z.enum(["draft", "published"]),
    isDemo: z.boolean().optional(),
  });

  router.get("/pages", async (_req, res) => {
    res.json(await prisma.page.findMany({ orderBy: { createdAt: "desc" } }));
  });

  router.get("/pages/:id", async (req, res) => {
    const row = await prisma.page.findUnique({ where: { id: req.params.id } });
    if (!row) {
      res.status(404).json({ error: "Page introuvable." });
      return;
    }
    res.json(row);
  });

  router.post("/pages", async (req, res) => {
    const body = parseBody(pageSchema, req.body, res);
    if (!body) return;
    const slug = body.slug.startsWith("/") ? body.slug : `/${body.slug}`;
    try {
      const row = await prisma.page.create({ data: { ...body, slug, isDemo: body.isDemo ?? true } });
      res.status(201).json(row);
    } catch {
      res.status(409).json({ error: "Cette adresse est déjà utilisée." });
    }
  });

  router.patch("/pages/:id", async (req, res) => {
    const body = parseBody(pageSchema, req.body, res);
    if (!body) return;
    const slug = body.slug.startsWith("/") ? body.slug : `/${body.slug}`;
    try {
      const row = await prisma.page.update({
        where: { id: req.params.id },
        data: { ...body, slug, isDemo: body.isDemo ?? true },
      });
      res.json(row);
    } catch {
      res.status(409).json({ error: "Page introuvable ou adresse déjà utilisée." });
    }
  });

  router.delete("/pages/:id", async (req, res) => {
    try {
      await prisma.page.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Page introuvable." });
    }
  });

  const articleSchema = z.object({
    title: z.string().trim().min(1, "Le titre est obligatoire."),
    excerpt: z.string().optional().default(""),
    body: z.string().optional().default(""),
    status: z.enum(["draft", "published"]),
    isDemo: z.boolean().optional(),
  });

  router.get("/articles", async (_req, res) => {
    res.json(await prisma.article.findMany({ orderBy: { createdAt: "desc" } }));
  });

  router.post("/articles", async (req, res) => {
    const body = parseBody(articleSchema, req.body, res);
    if (!body) return;
    const row = await prisma.article.create({ data: { ...body, isDemo: body.isDemo ?? true } });
    res.status(201).json(row);
  });

  router.patch("/articles/:id", async (req, res) => {
    const body = parseBody(articleSchema, req.body, res);
    if (!body) return;
    try {
      const row = await prisma.article.update({
        where: { id: req.params.id },
        data: { ...body, isDemo: body.isDemo ?? true },
      });
      res.json(row);
    } catch {
      res.status(404).json({ error: "Article introuvable." });
    }
  });

  router.delete("/articles/:id", async (req, res) => {
    try {
      await prisma.article.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Article introuvable." });
    }
  });

  const collectionSchema = z.object({
    name: z.string().trim().min(1, "Le nom est obligatoire."),
    blurb: z.string().optional().default(""),
    startsOn: z.string().min(8),
    endsOn: z.string().min(8),
    active: z.boolean().optional(),
  });

  router.get("/collections", async (_req, res) => {
    res.json(await prisma.collection.findMany({ orderBy: { startsOn: "desc" } }));
  });

  router.post("/collections", async (req, res) => {
    const body = parseBody(collectionSchema, req.body, res);
    if (!body) return;
    const row = await prisma.collection.create({
      data: { ...body, active: body.active ?? true, isDemo: true },
    });
    res.status(201).json(row);
  });

  router.delete("/collections/:id", async (req, res) => {
    try {
      await prisma.collection.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Collection introuvable." });
    }
  });

  router.get("/orders", async (_req, res) => {
    const rows = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
    res.json(rows.map((row) => ({ ...row, lines: JSON.parse(row.linesJson) })));
  });

  router.patch("/orders/:id", async (req, res) => {
    const status = String(req.body?.status || "");
    if (!["a_preparer", "expediee", "livree"].includes(status)) {
      res.status(400).json({ error: "Statut inconnu." });
      return;
    }
    try {
      const row = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
      res.json({ ...row, lines: JSON.parse(row.linesJson) });
    } catch {
      res.status(404).json({ error: "Commande introuvable." });
    }
  });

  router.get("/promotions", async (_req, res) => {
    const [promos, products, categories] = await Promise.all([
      prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.product.findMany(),
      prisma.category.findMany(),
    ]);
    res.json(promos.map((promo) => {
      const product = promo.scope === "all"
        ? products[0]
        : products.find((item) => item.id === promo.scope)
          || products.find((item) => item.categoryId === categories.find((cat) => cat.key === promo.scope || cat.id === promo.scope)?.id);
      const label = promo.scope === "all"
        ? "Tout le catalogue"
        : categories.find((cat) => cat.id === promo.scope || cat.key === promo.scope)?.name
          || products.find((item) => item.id === promo.scope)?.title
          || promo.scope;
      const before = product?.priceEur ?? 0;
      const after = Math.round(before * (100 - promo.percent)) / 100;
      return {
        ...promo,
        label,
        preview: product
          ? `−${promo.percent} % · ${label} : ${eur(before)} → ${eur(after)}. Donnée de démonstration.`
          : `−${promo.percent} % · ${label}.`,
      };
    }));
  });

  router.post("/promotions", async (req, res) => {
    const body = parseBody(z.object({
      name: z.string().trim().min(1, "Le nom est obligatoire."),
      percent: z.coerce.number().int().min(1).max(80),
      scope: z.string().min(1),
    }), req.body, res);
    if (!body) return;
    const row = await prisma.promotion.create({ data: { ...body, active: true, isDemo: true } });
    res.status(201).json(row);
  });

  router.delete("/promotions/:id", async (req, res) => {
    try {
      await prisma.promotion.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Promotion introuvable." });
    }
  });

  router.get("/stocks", async (_req, res) => {
    const rows = await prisma.product.findMany({ orderBy: { title: "asc" } });
    res.json(rows.map((row) => ({
      id: row.id,
      title: row.title,
      stock: row.stock,
      lowStock: row.lowStock,
      level: row.stock === 0 ? "rupture" : row.stock <= row.lowStock ? "bas" : "ok",
      isDemo: row.isDemo,
    })));
  });

  router.patch("/stocks/:id", async (req, res) => {
    const stock = Number(req.body?.stock);
    const lowStock = Number(req.body?.lowStock);
    if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(lowStock) || lowStock < 0) {
      res.status(400).json({ error: "Stock invalide." });
      return;
    }
    try {
      const row = await prisma.product.update({ where: { id: req.params.id }, data: { stock, lowStock } });
      res.json({ id: row.id, stock: row.stock, lowStock: row.lowStock });
    } catch {
      res.status(404).json({ error: "Produit introuvable." });
    }
  });

  router.get("/reviews", async (_req, res) => {
    const rows = await prisma.review.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } });
    res.json(rows.map((row) => ({
      id: row.id,
      body: row.body,
      authorName: row.authorName,
      rating: row.rating,
      status: row.status,
      isDemo: row.isDemo,
      productTitle: row.product.title,
    })));
  });

  router.patch("/reviews/:id", async (req, res) => {
    const status = String(req.body?.status || "");
    if (!["pending", "published", "hidden"].includes(status)) {
      res.status(400).json({ error: "Statut inconnu." });
      return;
    }
    try {
      const row = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
      res.json(row);
    } catch {
      res.status(404).json({ error: "Avis introuvable." });
    }
  });

  router.get("/customers", async (_req, res) => {
    const rows = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { favorites: true, addresses: true, orders: true } } },
    });
    res.json(rows);
  });

  router.get("/settings", async (_req, res) => {
    const [settings, countries] = await Promise.all([
      shop(),
      prisma.country.findMany({ orderBy: { name: "asc" } }),
    ]);
    res.json({ settings, countries });
  });

  router.patch("/settings", async (req, res) => {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      res.status(400).json({ error: "Le nom de la boutique est obligatoire." });
      return;
    }
    const row = await prisma.setting.update({
      where: { id: "shop" },
      data: {
        name,
        tagline: String(req.body?.tagline || "").trim() || "Des livres qui éveillent les cœurs et construisent les plus beaux lendemains",
        phone: String(req.body?.phone || "").trim() || "+221 77 123 45 67",
        partners: String(req.body?.partners ?? ""),
        eurEnabled: Boolean(req.body?.eurEnabled),
        xofEnabled: Boolean(req.body?.xofEnabled),
      },
    });
    res.json(row);
  });

  router.patch("/settings/games", async (req, res) => {
    const row = await prisma.setting.update({
      where: { id: "shop" },
      data: { games: Boolean(req.body?.enabled) },
    });
    res.json({ games: row.games });
  });

  router.post("/settings/banner", files.single("banner"), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Aucune photo reçue." });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    await prisma.media.create({ data: { filename: req.file.filename, url } });
    const row = await prisma.setting.update({ where: { id: "shop" }, data: { bannerUrl: url } });
    res.json({ bannerUrl: row.bannerUrl });
  });

  router.post("/settings/partner-logo", files.single("logo"), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Aucune image reçue." });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    await prisma.media.create({ data: { filename: req.file.filename, url } });
    res.json({ logoUrl: url });
  });

  router.post("/countries", async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const code = String(req.body?.code || "").trim().toUpperCase();
    const feeEur = Number(req.body?.feeEur);
    const feeXof = Number(req.body?.feeXof);
    if (!name || code.length < 2 || Number.isNaN(feeEur) || Number.isNaN(feeXof)) {
      res.status(400).json({ error: "Pays incomplet." });
      return;
    }
    try {
      const row = await prisma.country.create({
        data: { name, code, feeEur, feeXof: Math.round(feeXof), mobile: Boolean(req.body?.mobile) },
      });
      res.status(201).json(row);
    } catch {
      res.status(409).json({ error: "Ce code pays existe déjà." });
    }
  });

  router.delete("/countries/:id", async (req, res) => {
    try {
      await prisma.country.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Pays introuvable." });
    }
  });

  router.post("/settings/reset", async (_req, res) => {
    await resetDemo(prisma);
    clearSessionCookie(res);
    res.json({ ok: true, loggedOut: true });
  });
}

async function ensureCustomer(req: Request, res: Response) {
  const existingId = readClientId(req);
  if (existingId) {
    const found = await prisma.customer.findUnique({ where: { id: existingId } });
    if (found) return found;
  }
  const created = await prisma.customer.create({ data: {} });
  setClientCookie(res, created.id);
  return created;
}

async function spacePayload(customerId: string) {
  const settings = await shop();
  const games = settings?.games ?? false;
  const [customer, favorites, addresses, orders, categories, countries, picks, cart, promos] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    prisma.favorite.findMany({ where: { customerId }, include: { product: { include: { category: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.address.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { visible: true, ...(games ? {} : { isGames: false }) }, orderBy: { name: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { status: "published", ...(games ? {} : { category: { isGames: false } }) },
      include: { category: true },
      orderBy: { title: "asc" },
      take: 6,
    }),
    prisma.cartItem.findMany({ where: { customerId }, include: { product: { include: { category: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.promotion.findMany({ where: { active: true } }),
  ]);
  return {
    customer,
    cart: cart.flatMap((row) => {
      if (row.product.status !== "published") return [];
      if (row.product.category?.isGames && !games) return [];
      const item = catalogItem(row.product, promos, games);
      return [{
        id: row.id,
        productId: row.productId,
        qty: row.qty,
        title: item.title,
        priceEur: item.priceEur,
        priceXof: item.priceXof,
        compareEur: item.compareEur ?? null,
        stock: item.stock,
        categoryKey: item.categoryKey,
        imageUrl: item.imageUrl ?? null,
        promoPercent: "promoPercent" in item ? item.promoPercent : null,
      }];
    }),
    favorites: favorites.map((row) => ({
      id: row.id,
      productId: row.productId,
      title: row.product.title,
      priceEur: row.product.priceEur,
      priceXof: row.product.priceXof,
      ageBand: row.product.ageBand,
      categoryKey: row.product.category?.key || "prophetes",
    })),
    addresses,
    orders: orders.map((order) => ({
      id: order.id,
      number: order.number,
      destination: order.destination,
      status: order.status,
      totalEur: order.totalEur,
      isDemo: order.isDemo,
      createdAt: order.createdAt,
    })),
    categories: categories.map((row) => ({ name: row.name, key: row.key })),
    countries: countries.map((row) => ({ name: row.name, code: row.code })),
    picks: picks.map((row) => ({
      id: row.id,
      title: row.title,
      priceEur: row.priceEur,
      categoryKey: row.category?.key || "prophetes",
    })),
    shop: {
      name: settings?.name ?? "Fahmia Kids",
      tagline: settings?.tagline ?? "",
      phone: settings?.phone ?? "",
    },
  };
}

export async function publicSpace(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  res.json(await spacePayload(customer.id));
}

export async function publicSpaceUpdate(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const phone = String(req.body?.phone || "").trim();
  if (email && !email.includes("@")) {
    res.status(400).json({ error: "L’e-mail doit contenir @." });
    return;
  }
  await prisma.customer.update({ where: { id: customer.id }, data: { name, email, phone } });
  res.json(await spacePayload(customer.id));
}

export async function publicSpaceLogout(req: Request, res: Response) {
  clearClientCookie(res);
  res.json({ ok: true });
}

export async function publicCartAdd(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  const productId = String(req.body?.productId || "");
  const product = await prisma.product.findFirst({ where: { id: productId, status: "published" } });
  if (!product) {
    res.status(404).json({ error: "Livre introuvable." });
    return;
  }
  if (product.stock < 1) {
    res.status(400).json({ error: "Ce livre est en rupture." });
    return;
  }
  const existing = await prisma.cartItem.findUnique({ where: { customerId_productId: { customerId: customer.id, productId } } });
  const qty = Math.min(product.stock, (existing?.qty ?? 0) + 1);
  await prisma.cartItem.upsert({
    where: { customerId_productId: { customerId: customer.id, productId } },
    update: { qty },
    create: { customerId: customer.id, productId, qty },
  });
  res.status(201).json(await spacePayload(customer.id));
}

export async function publicCartSet(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  const productId = String(req.params.productId);
  const product = await prisma.product.findFirst({ where: { id: productId, status: "published" } });
  const asked = Math.floor(Number(req.body?.qty));
  if (!product || !Number.isFinite(asked) || asked < 1 || product.stock < 1) {
    await prisma.cartItem.deleteMany({ where: { customerId: customer.id, productId } });
    res.json(await spacePayload(customer.id));
    return;
  }
  await prisma.cartItem.updateMany({
    where: { customerId: customer.id, productId },
    data: { qty: Math.min(product.stock, asked) },
  });
  res.json(await spacePayload(customer.id));
}

export async function publicCartRemove(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  await prisma.cartItem.deleteMany({ where: { customerId: customer.id, productId: String(req.params.productId) } });
  res.json(await spacePayload(customer.id));
}

export async function publicFavoriteAdd(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  const productId = String(req.body?.productId || "");
  const product = await prisma.product.findFirst({ where: { id: productId, status: "published" } });
  if (!product) {
    res.status(404).json({ error: "Livre introuvable." });
    return;
  }
  await prisma.favorite.upsert({
    where: { customerId_productId: { customerId: customer.id, productId } },
    update: {},
    create: { customerId: customer.id, productId },
  });
  res.status(201).json(await spacePayload(customer.id));
}

export async function publicFavoriteRemove(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  await prisma.favorite.deleteMany({ where: { customerId: customer.id, productId: String(req.params.productId) } });
  res.json(await spacePayload(customer.id));
}

export async function publicAddressAdd(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  const line = String(req.body?.line || "").trim();
  const city = String(req.body?.city || "").trim();
  const country = String(req.body?.country || "").trim();
  const label = String(req.body?.label || "Domicile").trim() || "Domicile";
  if (!line || !country) {
    res.status(400).json({ error: "L’adresse et le pays sont obligatoires." });
    return;
  }
  await prisma.address.create({ data: { customerId: customer.id, label, line, city, country } });
  res.status(201).json(await spacePayload(customer.id));
}

export async function publicAddressRemove(req: Request, res: Response) {
  const customer = await ensureCustomer(req, res);
  await prisma.address.deleteMany({ where: { id: String(req.params.id), customerId: customer.id } });
  res.json(await spacePayload(customer.id));
}

function catalogItem(row: Parameters<typeof presentProduct>[0], promos: { scope: string; percent: number }[], games: boolean) {
  const promo = promos.find((item) => item.scope === "all" || item.scope === row.id || item.scope === row.category?.key);
  const base = presentProduct(row, games);
  const categoryKey = row.category?.key ?? "";
  if (!promo) return { ...base, categoryKey };
  const rate = promo.percent / 100;
  return {
    ...base,
    categoryKey,
    promoPercent: promo.percent,
    priceEur: +((row.priceEur * (1 - rate)).toFixed(2)),
    priceXof: Math.round(row.priceXof * (1 - rate)),
    compareEur: row.priceEur,
    compareXof: row.priceXof,
  };
}

function readPartners(raw: string | null | undefined) {
  const text = (raw ?? "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const rows = JSON.parse(text) as { name?: string; logoUrl?: string }[];
      return rows
        .map((row) => ({ name: String(row.name || "").trim(), logoUrl: String(row.logoUrl || "").trim() }))
        .filter((row) => row.name);
    } catch {
      return [];
    }
  }
  return text.split("\n").map((name) => name.trim()).filter(Boolean).map((name) => ({ name, logoUrl: "" }));
}

export async function publicShop(_req: Request, res: Response) {
  const [settings, countries] = await Promise.all([
    shop(),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
  ]);
  res.json({
    name: settings?.name ?? "Fahmia Kids",
    tagline: settings?.tagline ?? "",
    phone: settings?.phone ?? "+221 77 123 45 67",
    partners: readPartners(settings?.partners),
    countries: countries.map((row) => row.name),
  });
}

export async function publicCatalog(_req: Request, res: Response) {
  const settings = await shop();
  const games = settings?.games ?? false;
  const [rows, promos] = await Promise.all([
    prisma.product.findMany({
      where: { status: "published" },
      include: { category: true },
      orderBy: { title: "asc" },
    }),
    prisma.promotion.findMany({ where: { active: true } }),
  ]);
  res.json(rows.filter((row) => !(row.category?.isGames && !games)).map((row) => catalogItem(row, promos, games)));
}

export async function publicProduct(req: Request, res: Response) {
  const settings = await shop();
  const games = settings?.games ?? false;
  const row = await prisma.product.findFirst({
    where: { id: String(req.params.id), status: "published" },
    include: {
      category: true,
      reviews: { where: { status: "published" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!row || (row.category?.isGames && !games)) {
    res.status(404).json({ error: "Livre introuvable." });
    return;
  }
  const [promos, pool] = await Promise.all([
    prisma.promotion.findMany({ where: { active: true } }),
    prisma.product.findMany({
      where: { status: "published", id: { not: row.id } },
      include: { category: true },
      orderBy: { title: "asc" },
    }),
  ]);
  const visible = pool.filter((item) => games || !item.category?.isGames);
  const related = [
    ...visible.filter((item) => item.categoryId && item.categoryId === row.categoryId),
    ...visible.filter((item) => item.categoryId !== row.categoryId),
  ].slice(0, 5);
  res.json({
    ...catalogItem(row, promos, games),
    reviews: row.reviews.map((review) => ({
      id: review.id,
      authorName: review.authorName,
      body: review.body,
      rating: review.rating,
      isDemo: review.isDemo,
    })),
    related: related.map((item) => catalogItem(item, promos, games)),
  });
}

export function asyncGuard(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = error instanceof Error ? error.message : "Erreur interne.";
  if (message === "Choisissez une image." || message.includes("File too large")) {
    res.status(400).json({ error: message.includes("large") ? "Image trop lourde (8 Mo max)." : message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Erreur interne." });
}
