import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "./session";

export async function resetDemo(prisma: PrismaClient) {
  await prisma.session.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.address.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.page.deleteMany();
  await prisma.article.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.media.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.country.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const passwordHash = await hashPassword("demo");
  await prisma.user.create({
    data: {
      name: "Awa Diallo",
      email: "gerant@fahmiakids.com",
      passwordHash,
      isDemo: true,
    },
  });

  await prisma.category.createMany({
    data: [
      { id: "c1", name: "Histoires des prophètes", key: "prophetes", parent: "Livres" },
      { id: "c2", name: "Coran pour enfants", key: "coran", parent: "Livres" },
      { id: "c3", name: "Apprentissage de l’arabe", key: "arabe", parent: "Livres" },
      { id: "c4", name: "Invocations", key: "invocations", parent: "Livres" },
      { id: "c5", name: "Bonnes valeurs", key: "valeurs", parent: "Livres" },
      { id: "c7", name: "Contes islamiques", key: "contes", parent: "Livres" },
      { id: "c6", name: "Jeux et activités", key: "jeux", parent: "Livres", isGames: true },
    ],
  });

  const book = (
    id: string,
    title: string,
    ageBand: string,
    categoryId: string,
    priceEur: number,
    priceXof: number,
    stock: number,
    blurb: string,
    description: string,
    extra: { type?: string; compareEur?: number } = {},
  ) => ({
    id,
    title,
    type: extra.type || "BOOK",
    blurb,
    description,
    advice: "À lire avec un parent, une page à la fois.",
    author: "Fahmia Kids",
    priceEur,
    priceXof,
    compareEur: extra.compareEur ?? null,
    stock,
    lowStock: 5,
    ageBand,
    status: "published",
    isDemo: true,
    categoryId,
  });

  await prisma.product.createMany({
    data: [
      book("p1", "Le Prophète Mohammed (Illustré pour enfants)", "6-8", "c1", 15.18, 9950, 24, "La vie du Prophète racontée avec de grandes images.", "De grandes images suivent les étapes de la vie du Prophète Mohammed. Les phrases restent courtes pour qu’un adulte puisse lire une page, puis laisser l’enfant raconter ce qu’il a vu."),
      book("p2", "Le Coran pour enfants avec illustrations", "6-8", "c2", 14.9, 9800, 18, "Des passages racontés simplement, page après page.", "Quelques passages du Coran sont racontés avec des mots simples et des illustrations. L’enfant découvre le sens du récit avant d’aborder la lecture."),
      book("p3", "L’alphabet arabe pour les enfants", "3-5", "c3", 9.9, 6500, 32, "Les lettres, une par une, pour commencer à lire.", "Chaque page présente une lettre arabe, sa forme et un mot pour la reconnaître. Le livre avance lentement, pour les premières séances avec un tout-petit."),
      book("p4", "Les 4 califes bien guidés (illustré)", "6-8", "c5", 12.9, 8500, 16, "Quatre récits illustrés pour découvrir les califes.", "Quatre récits illustrés présentent Abou Bakr, Omar, Othman et Ali. Chaque histoire tient en quelques pages, avec une idée simple à retenir."),
      book("p5", "La vie du Prophète racontée aux enfants", "6-8", "c1", 13.9, 9100, 21, "Un récit suivi, doux, pour les premières lectures.", "Un récit suivi, au ton calme, pour les enfants qui peuvent écouter une histoire plus longue. Il reprend la vie du Prophète sans multiplier les détails."),
      book("p6", "Contes du soir et de la sagesse", "6-8", "c7", 11.9, 7800, 12, "Des contes courts pour terminer la journée.", "Des contes courts, prévus pour la fin de journée. Chaque histoire se termine sur une valeur : la patience, le partage ou la parole douce."),
      book("p7", "Jeu des lettres du jardin", "6-8", "c6", 16, 10500, 4, "Un jeu pour reconnaître les lettres arabes.", "Un jeu de reconnaissance des lettres arabes, à sortir quand l’enfant connaît déjà quelques formes. Les règles tiennent sur une page.", { type: "GAME" }),
    ],
  });

  await prisma.promotion.create({
    data: { id: "pr1", name: "Promo", percent: 15, scope: "p1", active: true, isDemo: true },
  });

  await prisma.review.createMany({
    data: [
      {
        id: "r1",
        productId: "p1",
        authorName: "Aïssatou D.",
        body: "Les livres de Fahmia Kids sont vraiment exceptionnels. Ma fille adore ces histoires et apprend beaucoup !",
        rating: 5,
        status: "published",
        isDemo: true,
      },
      {
        id: "r2",
        productId: "p2",
        authorName: "Mamadou S.",
        body: "Très belles illustrations. Mon fils demande la suite après chaque page.",
        rating: 5,
        status: "pending",
        isDemo: true,
      },
    ],
  });

  await prisma.page.create({
    data: {
      id: "pg1",
      title: "Livraison",
      slug: "/livraison",
      body: "Les frais et le délai dépendent du pays choisi à la commande. Cette page est une démonstration.",
      status: "draft",
      isDemo: true,
    },
  });

  await prisma.article.createMany({
    data: [
      {
        id: "a1",
        title: "Lire un récit de prophète à 6 ans",
        excerpt: "Comment s’arrêter sur une image et poser une seule question.",
        body: "Une page, une image, une question. Puis on ferme le livre.",
        status: "published",
        isDemo: true,
      },
      {
        id: "a2",
        title: "Préparer un coffret d’anniversaire",
        excerpt: "Deux livres du même âge valent mieux qu’un grand paquet mêlé.",
        body: "Choisissez la même tranche d’âge. Le prix du coffret s’affiche avant l’ajout.",
        status: "published",
        isDemo: true,
      },
    ],
  });

  await prisma.collection.create({
    data: {
      id: "col1",
      name: "Lectures pour le Ramadan",
      blurb: "Une sélection limitée dans le temps.",
      startsOn: "2027-02-08",
      endsOn: "2027-03-09",
      active: true,
      isDemo: true,
    },
  });

  await prisma.order.create({
    data: {
      id: "o1",
      number: "FK-1042",
      destination: "Dakar · Sénégal",
      totalEur: 17.4,
      payment: "Démonstration · Wave",
      status: "a_preparer",
      isDemo: true,
      linesJson: JSON.stringify([
        { title: "Le Prophète Mohammed (Illustré pour enfants)", qty: 1, priceEur: 12.9 },
        { title: "Livraison Sénégal", qty: 1, priceEur: 4.5 },
      ]),
    },
  });

  await prisma.country.createMany({
    data: [
      { code: "SN", name: "Sénégal", feeEur: 4.5, feeXof: 3000, mobile: true },
      { code: "FR", name: "France", feeEur: 3.5, feeXof: 2300, mobile: false },
      { code: "BE", name: "Belgique", feeEur: 4.9, feeXof: 3200, mobile: false },
      { code: "CA", name: "Canada", feeEur: 9, feeXof: 5900, mobile: false },
      { code: "MA", name: "Maroc", feeEur: 7.5, feeXof: 4900, mobile: false },
      { code: "CI", name: "Côte d’Ivoire", feeEur: 6.5, feeXof: 4300, mobile: true },
    ],
  });

  await prisma.setting.create({
    data: {
      id: "shop",
      name: "Fahmia Kids",
      eurEnabled: true,
      xofEnabled: true,
      games: false,
      bannerUrl: null,
      tagline: "Des livres qui éveillent les cœurs et construisent les plus beaux lendemains",
      phone: "+221 77 123 45 67",
      partners: JSON.stringify([
        { name: "Éditions du Croissant clair", logoUrl: "/partners/croissant.svg" },
        { name: "Atelier des Petites Lettres", logoUrl: "/partners/lettres.svg" },
        { name: "Maison des Récits", logoUrl: "/partners/recits.svg" },
      ]),
    },
  });
}
