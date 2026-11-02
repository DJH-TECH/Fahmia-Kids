import "../src/env";
import { prisma } from "../src/prisma";
import { resetDemo } from "../src/seed-data";

await resetDemo(prisma);
await prisma.$disconnect();
console.log("Données de démonstration chargées. Compte : gerant@fahmiakids.com / demo");
