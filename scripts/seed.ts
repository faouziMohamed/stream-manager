/**
 * Seed script — populates the DB with streaming services, plans, promotions,
 * sample clients, subscriptions and payments.
 *
 * Run with:  npx tsx scripts/seed.ts
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { nanoid } from "nanoid";
import * as schema from "../src/lib/db/schema";

// ── DB connection ─────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL!;
const DB_SSL_CA = process.env.DB_SSL_CA;

const client = postgres(DATABASE_URL, {
  ssl: DB_SSL_CA ? { ca: DB_SSL_CA } : undefined,
  max: 1,
});
const db = drizzle(client, { schema });

const {
  services,
  plans,
  promotions,
  promotionServices,
  clients,
  subscriptions,
  payments,
  appSettings,
} = schema;

// ── Helpers ───────────────────────────────────────────────────────────────────
const id = () => nanoid();
const MAD = "MAD";

function addMonths(date: string, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  // Go back one day so "start + duration" means end of period not start of next
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ── Service IDs ───────────────────────────────────────────────────────────────
const netflixId = id();
const shahidId = id();
const disneyId = id();
const primeId = id();
const spotifyId = id();

// ── Promotion IDs ─────────────────────────────────────────────────────────────
const promoTripleId = id(); // Netflix + Shahid + Prime
const promoDuoId = id(); // Netflix + Prime

// ── Client IDs ───────────────────────────────────────────────────────────────
const client1Id = id();
const client2Id = id();
const client3Id = id();

async function seed() {
  console.log("🌱 Starting seed...");

  // ── Default currency ───────────────────────────────────────────────────────
  await db
    .insert(appSettings)
    .values({ key: "defaultCurrency", value: "MAD" })
    .onConflictDoNothing();

  // ── Services ───────────────────────────────────────────────────────────────
  await db
    .insert(services)
    .values([
      {
        id: netflixId,
        name: "Netflix",
        category: "Streaming vidéo",
        description: "Films et séries en streaming.",
      },
      {
        id: shahidId,
        name: "Shahid VIP",
        category: "Streaming vidéo",
        description: "Contenu arabe et séries du Moyen-Orient.",
      },
      {
        id: disneyId,
        name: "Disney+",
        category: "Streaming vidéo",
        description: "Disney, Marvel, Star Wars et plus.",
      },
      {
        id: primeId,
        name: "Prime Video",
        category: "Streaming vidéo",
        description: "Films et séries Amazon Originals.",
      },
      {
        id: spotifyId,
        name: "Spotify",
        category: "Musique",
        description: "Streaming musical sans publicité.",
      },
    ])
    .onConflictDoNothing();

  // ── Individual service plans ───────────────────────────────────────────────
  const servicePlans: (typeof plans.$inferInsert)[] = [
    // Netflix
    {
      id: id(),
      serviceId: netflixId,
      name: "Netflix 1 mois",
      durationMonths: 1,
      price: "39",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: netflixId,
      name: "Netflix 2 mois",
      durationMonths: 2,
      price: "79",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: netflixId,
      name: "Netflix 3 mois",
      durationMonths: 3,
      price: "119",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: netflixId,
      name: "Netflix 4 mois",
      durationMonths: 4,
      price: "149",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: netflixId,
      name: "Netflix 6 mois",
      durationMonths: 6,
      price: "220",
      currencyCode: MAD,
      planType: "full",
    },
    // Shahid VIP
    {
      id: id(),
      serviceId: shahidId,
      name: "Shahid 3 mois",
      durationMonths: 3,
      price: "89",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: shahidId,
      name: "Shahid 4 mois",
      durationMonths: 4,
      price: "119",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: shahidId,
      name: "Shahid 6 mois",
      durationMonths: 6,
      price: "149",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: shahidId,
      name: "Shahid 12 mois",
      durationMonths: 12,
      price: "249",
      currencyCode: MAD,
      planType: "full",
    },
    // Disney+
    {
      id: id(),
      serviceId: disneyId,
      name: "Disney+ 1 mois",
      durationMonths: 1,
      price: "39",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: disneyId,
      name: "Disney+ 2 mois",
      durationMonths: 2,
      price: "79",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: disneyId,
      name: "Disney+ 3 mois",
      durationMonths: 3,
      price: "119",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: disneyId,
      name: "Disney+ 4 mois",
      durationMonths: 4,
      price: "149",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: disneyId,
      name: "Disney+ 6 mois",
      durationMonths: 6,
      price: "220",
      currencyCode: MAD,
      planType: "full",
    },
    // Prime Video
    {
      id: id(),
      serviceId: primeId,
      name: "Prime 1 mois",
      durationMonths: 1,
      price: "35",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: primeId,
      name: "Prime 2 mois",
      durationMonths: 2,
      price: "69",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: primeId,
      name: "Prime 3 mois",
      durationMonths: 3,
      price: "100",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: primeId,
      name: "Prime 4 mois",
      durationMonths: 4,
      price: "129",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: primeId,
      name: "Prime 6 mois",
      durationMonths: 6,
      price: "199",
      currencyCode: MAD,
      planType: "full",
    },
    // Spotify
    {
      id: id(),
      serviceId: spotifyId,
      name: "Spotify 1 mois",
      durationMonths: 1,
      price: "39",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: spotifyId,
      name: "Spotify 3 mois",
      durationMonths: 3,
      price: "99",
      currencyCode: MAD,
      planType: "full",
    },
    {
      id: id(),
      serviceId: spotifyId,
      name: "Spotify 6 mois",
      durationMonths: 6,
      price: "159",
      currencyCode: MAD,
      planType: "full",
    },
  ];
  await db.insert(plans).values(servicePlans).onConflictDoNothing();

  // ── Promotions ─────────────────────────────────────────────────────────────
  await db
    .insert(promotions)
    .values([
      {
        id: promoTripleId,
        name: "Netflix + Shahid VIP + Prime Video",
        description: "Pack complet 3 plateformes pour un prix réduit.",
      },
      {
        id: promoDuoId,
        name: "Netflix + Prime Video",
        description: "Pack duo Netflix et Prime Video.",
      },
    ])
    .onConflictDoNothing();

  // ── Promotion ↔ Service links ──────────────────────────────────────────────
  await db
    .insert(promotionServices)
    .values([
      { id: nanoid(), promotionId: promoTripleId, serviceId: netflixId },
      { id: nanoid(), promotionId: promoTripleId, serviceId: shahidId },
      { id: nanoid(), promotionId: promoTripleId, serviceId: primeId },
      { id: nanoid(), promotionId: promoDuoId, serviceId: netflixId },
      { id: nanoid(), promotionId: promoDuoId, serviceId: primeId },
    ])
    .onConflictDoNothing();

  // ── Promotion plans ────────────────────────────────────────────────────────
  const promoTriplePlan3mId = id();
  const promoDuo1mId = id();

  await db
    .insert(plans)
    .values([
      // Triple pack
      {
        id: id(),
        promotionId: promoTripleId,
        name: "Triple 1 mois",
        durationMonths: 1,
        price: "69",
        currencyCode: MAD,
        planType: "bundle",
      },
      {
        id: id(),
        promotionId: promoTripleId,
        name: "Triple 2 mois",
        durationMonths: 2,
        price: "139",
        currencyCode: MAD,
        planType: "bundle",
      },
      {
        id: promoTriplePlan3mId,
        promotionId: promoTripleId,
        name: "Triple 3 mois",
        durationMonths: 3,
        price: "199",
        currencyCode: MAD,
        planType: "bundle",
      },
      // Duo pack
      {
        id: promoDuo1mId,
        promotionId: promoDuoId,
        name: "Duo 1 mois",
        durationMonths: 1,
        price: "55",
        currencyCode: MAD,
        planType: "bundle",
      },
      {
        id: id(),
        promotionId: promoDuoId,
        name: "Duo 2 mois",
        durationMonths: 2,
        price: "99",
        currencyCode: MAD,
        planType: "bundle",
      },
      {
        id: id(),
        promotionId: promoDuoId,
        name: "Duo 3 mois",
        durationMonths: 3,
        price: "149",
        currencyCode: MAD,
        planType: "bundle",
      },
      {
        id: id(),
        promotionId: promoDuoId,
        name: "Duo 6 mois",
        durationMonths: 6,
        price: "279",
        currencyCode: MAD,
        planType: "bundle",
      },
    ])
    .onConflictDoNothing();

  // ── Sample clients ─────────────────────────────────────────────────────────
  await db
    .insert(clients)
    .values([
      {
        id: client1Id,
        name: "Ahmed Benali",
        email: "ahmed@exemple.com",
        phone: "+212 6 12 34 56 78",
      },
      {
        id: client2Id,
        name: "Fatima Zahra",
        email: "fatima@exemple.com",
        phone: "+212 6 98 76 54 32",
      },
      {
        id: client3Id,
        name: "Youssef El Idrissi",
        email: null,
        phone: "+212 6 55 44 33 22",
      },
    ])
    .onConflictDoNothing();

  // ── Sample subscriptions + payments ───────────────────────────────────────
  // We need a plan ID for sample subscriptions — pick Netflix 3 mois and Triple 3 mois
  const netflixPlan3m = servicePlans.find((p) => p.name === "Netflix 3 mois")!;
  const spotifyPlan3m = servicePlans.find((p) => p.name === "Spotify 3 mois")!;

  const today = new Date().toISOString().slice(0, 10);
  const sub1Id = id();
  const sub2Id = id();
  const sub3Id = id();

  await db
    .insert(subscriptions)
    .values([
      {
        id: sub1Id,
        clientId: client1Id,
        planId: netflixPlan3m.id,
        startDate: today,
        endDate: addMonths(today, 3),
        isRecurring: true,
        status: "active",
      },
      {
        id: sub2Id,
        clientId: client2Id,
        planId: promoTriplePlan3mId,
        startDate: today,
        endDate: addMonths(today, 3),
        isRecurring: false,
        status: "active",
      },
      {
        id: sub3Id,
        clientId: client3Id,
        planId: spotifyPlan3m.id,
        startDate: today,
        endDate: addMonths(today, 3),
        isRecurring: true,
        status: "active",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(payments)
    .values([
      {
        id: id(),
        subscriptionId: sub1Id,
        dueDate: today,
        amount: netflixPlan3m.price,
        currencyCode: MAD,
        status: "unpaid",
      },
      {
        id: id(),
        subscriptionId: sub2Id,
        dueDate: today,
        amount: "199",
        currencyCode: MAD,
        status: "unpaid",
      },
      {
        id: id(),
        subscriptionId: sub3Id,
        dueDate: today,
        amount: spotifyPlan3m.price,
        currencyCode: MAD,
        status: "unpaid",
      },
    ])
    .onConflictDoNothing();

  console.log("✅ Seed complete!");
  console.log(
    "   Services : Netflix, Shahid VIP, Disney+, Prime Video, Spotify",
  );
  console.log("   Promotions: Triple pack, Duo pack");
  console.log("   Clients  : 3 sample clients");
  console.log("   Subscriptions + payments: 3 active subscriptions");
  await client.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
