import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { AuctionStatus, Role } from "../generated/prisma/enums";
import { hashPassword } from "../src/lib/password-core";
import { slugify } from "../src/lib/utils";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Configura DATABASE_URL para ejecutar el seed.");
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const rawAdminPassword = process.env.ADMIN_PASSWORD;
const demoEmail = (process.env.DEMO_USER_EMAIL || "coleccionista@bidhub.local").trim().toLowerCase();
const rawDemoPassword = process.env.DEMO_USER_PASSWORD;
function requireEmail(value: string | undefined): string {
  if (!value) throw new Error("Define ADMIN_EMAIL.");
  return value;
}
function requirePassword(value: string | undefined, name: string): string {
  if (!value || value.length < 12) throw new Error(`Define ${name} (mínimo 12 caracteres).`);
  return value;
}
const requiredAdminEmail = requireEmail(adminEmail);
const adminPassword = requirePassword(rawAdminPassword, "ADMIN_PASSWORD");
const demoPassword = requirePassword(rawDemoPassword, "DEMO_USER_PASSWORD para crear ejemplos con ofertas");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 1 }) });

async function main() {
  const [adminHash, demoHash] = await Promise.all([hashPassword(adminPassword), hashPassword(demoPassword)]);
  const admin = await prisma.user.upsert({
    where: { email: requiredAdminEmail },
    update: { fullName: process.env.ADMIN_FULL_NAME || "BidHub Admin", role: Role.ADMIN, passwordHash: adminHash },
    create: { email: requiredAdminEmail, fullName: process.env.ADMIN_FULL_NAME || "BidHub Admin", role: Role.ADMIN, passwordHash: adminHash },
  });
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { fullName: process.env.DEMO_USER_FULL_NAME || "Alex Coleccionista", passwordHash: demoHash },
    create: { email: demoEmail, fullName: process.env.DEMO_USER_FULL_NAME || "Alex Coleccionista", role: Role.USER, passwordHash: demoHash },
  });

  const categoryNames = ["Cartas coleccionables", "Relojes", "Vinilos", "Figuras", "Arte y objetos"];
  const categories = await Promise.all(categoryNames.map((name) => prisma.category.upsert({
    where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) },
  })));

  const samples = [
    { title: "Vinilo edición original de salsa", description: "Prensado original en excelente estado, con funda interior y portada protegida. Una pieza especial para coleccionistas de música latina.", category: categories[2], closesAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: AuctionStatus.ACTIVE, initialPrice: "85000", minIncrement: "5000", bidder: null, amount: null },
    { title: "Reloj clásico de cuerda manual", description: "Reloj mecánico vintage revisado por relojero, conserva su esfera original y presenta señales de uso normales para su edad.", category: categories[1], closesAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: AuctionStatus.CLOSED, initialPrice: "320000", minIncrement: "20000", bidder: demoUser, amount: "380000" },
    { title: "Figura de colección edición numerada", description: "Figura numerada de edición limitada, incluye caja y certificado de autenticidad. Se mantiene en vitrina, sin exposición directa al sol.", category: categories[3], closesAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: AuctionStatus.DESERTED, initialPrice: "145000", minIncrement: "10000", bidder: null, amount: null },
    { title: "Lote de cartas de primera generación", description: "Selección de cartas clásicas en fundas protectoras. Lote conservado en ambiente seco; consulta las fotos para revisar el estado.", category: categories[0], closesAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: AuctionStatus.CANCELLED, initialPrice: "60000", minIncrement: "5000", bidder: null, amount: null },
  ];

  for (const sample of samples) {
    const existing = await prisma.auction.findFirst({ where: { sellerId: admin.id, title: sample.title }, select: { id: true } });
    const auctionData = {
      title: sample.title, description: sample.description, imageUrl: "/items/collectible.svg",
      categoryId: sample.category.id, sellerId: admin.id,
      initialPrice: new Prisma.Decimal(sample.initialPrice), minIncrement: new Prisma.Decimal(sample.minIncrement),
      closesAt: sample.closesAt, status: sample.status,
      cancellationReason: sample.status === AuctionStatus.CANCELLED ? "Ejemplo de moderación: publicación de demostración cancelada por el administrador." : null,
      cancelledById: sample.status === AuctionStatus.CANCELLED ? admin.id : null,
    };
    const auction = existing
      ? await prisma.auction.update({ where: { id: existing.id }, data: auctionData })
      : await prisma.auction.create({ data: auctionData });
    if (sample.bidder && sample.amount) {
      await prisma.bid.upsert({
        where: { idempotencyKey: `seed-${sample.title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}` },
        update: { amount: new Prisma.Decimal(sample.amount), auctionId: auction.id, bidderId: sample.bidder.id },
        create: { amount: new Prisma.Decimal(sample.amount), auctionId: auction.id, bidderId: sample.bidder.id, idempotencyKey: `seed-${sample.title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}` },
      });
    }
  }
  console.info(`Seed listo: admin ${admin.email}; usuario demo ${demoUser.email}; ${categoryNames.length} categorías; 4 subastas.`);
}

main().catch((error: unknown) => { console.error("Falló el seed:", error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
