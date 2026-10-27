/* Seed script — DEMO data only. Creates admin from env vars (never hardcoded),
 * a demo user, and sample draws across statuses. Idempotent-ish: uses upsert on
 * unique keys so running twice won't duplicate rows. */
import { PrismaClient, DrawStatus } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;
  const startingCredits = Number(process.env.STARTING_DEMO_CREDITS ?? 500);

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME ?? "Demo Admin",
      hashedPassword: await hash(adminPassword),
      role: "ADMIN",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@demo.local" },
    update: {},
    create: {
      email: "demo@demo.local",
      name: "Demo User",
      hashedPassword: await hash("DemoPass-2026!"),
    },
  });

  // Award starting balance once (skip if any transaction exists already).
  for (const user of [admin, demoUser]) {
    const existing = await prisma.demoCreditTransaction.findFirst({
      where: { userId: user.id, type: "AWARD" },
    });
    if (!existing && startingCredits > 0) {
      await prisma.demoCreditTransaction.create({
        data: {
          userId: user.id,
          type: "AWARD",
          amount: startingCredits,
          balanceAfter: startingCredits,
          note: "Starting demo balance",
        },
      });
    }
  }

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const sampleDraws = [
    {
      slug: "demo-tablet-festival",
      title: "Win a Nebula Nova 10\" Tablet",
      prizeName: "Nebula Nova 10-inch Tablet",
      description:
        "DEMO draw: A sleek 10-inch tablet with an octa-core processor, 128GB storage and an AMOLED display. This is a simulation — no real prizes are shipped. Submit a bid amount between min and max; the lowest unique amount wins when the draw closes.",
      minBid: 0.1,
      maxBid: 25,
      bidCreditFee: 5,
      status: "ACTIVE",
      opensAt: new Date(now - 2 * DAY),
      closesAt: new Date(now + 3 * DAY),
    },
    {
      slug: "demo-headphones-classic",
      title: "Win Aster Studio Wireless Headphones",
      prizeName: "Aster Studio Wireless Headphones",
      description:
        "DEMO draw: Over-ear, noise-cancelling wireless headphones with 40-hour battery life. Simulation only — nothing is delivered. Place a bid between the limits; lowest unique amount takes the win.",
      minBid: 0.05,
      maxBid: 10,
      bidCreditFee: 3,
      status: "ACTIVE",
      opensAt: new Date(now - 1 * DAY),
      closesAt: new Date(now + 5 * DAY),
    },
    {
      slug: "demo-smartwatch-future",
      title: "Win an Orbit Pulse Smartwatch",
      prizeName: "Orbit Pulse Smartwatch",
      description:
        "UPCOMING DEMO draw: GPS smartwatch with health tracking and 2-week battery life. Opens soon — watch this space. Simulation only.",
      minBid: 0.2,
      maxBid: 30,
      bidCreditFee: 4,
      status: "UPCOMING",
      opensAt: new Date(now + 2 * DAY),
      closesAt: new Date(now + 9 * DAY),
    },
    {
      slug: "demo-speaker-past",
      title: "Win a Kanaloa Go Bluetooth Speaker",
      prizeName: "Kanaloa Go Bluetooth Speaker",
      description:
        "CLOSED DEMO draw: Waterproof portable speaker with punchy bass. Bidding ended — settle results from the admin panel to compute the lowest unique amount.",
      minBid: 0.1,
      maxBid: 15,
      bidCreditFee: 2,
      status: "CLOSED",
      opensAt: new Date(now - 10 * DAY),
      closesAt: new Date(now - 1 * DAY),
    },
  ];

  const drawDefs = [
    { name: "tablet", src: "/draws/tablet.svg", alt: "A 10-inch tablet illustration" },
    { name: "headphones", src: "/draws/headphones.svg", alt: "Wireless headphones illustration" },
    { name: "smartwatch", src: "/draws/smartwatch.svg", alt: "Smartwatch illustration" },
    { name: "speaker", src: "/draws/speaker.svg", alt: "Portable speaker illustration" },
  ];

  for (const def of sampleDraws) {
    const key = ["tablet", "headphones", "smartwatch", "speaker", "speaker"].find((n) =>
      def.title.toLowerCase().includes(n)
    ) ?? "tablet";
    const imageDef = drawDefs.find((d) => d.name === key)!;

    await prisma.draw.upsert({
      where: { slug: def.slug },
      update: {
      status: def.status as DrawStatus,
        description: def.description,
      },
      create: {
        ...def,
        status: def.status as DrawStatus,
        prizeImages: {
          create: [{ src: imageDef.src, alt: imageDef.alt, sortOrder: 0 }],
        },
      },
    });
  }

  console.log("Seeded: admin, demo user, active/upcoming/closed draws.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
