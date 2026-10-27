import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(72),
});

export const bidSchema = z.object({
  drawId: z.string().cuid(),
  amount: z.number().gt(0),
});

export const drawUpsertSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "lowercase letters, digits and dashes only"),
    title: z.string().trim().min(3).max(160),
    prizeName: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(4000),
    currency: z.string().trim().min(2).max(8).default("ETB"),
    bidPrecision: z.number().int().min(0).max(4).default(2),
    minBid: z.number().gt(0).max(1_000_000),
    maxBid: z.number().gt(0).max(1_000_000),
    bidCreditFee: z.number().min(0).max(10_000).default(0),
    status: z.enum(["DRAFT", "UPCOMING", "ACTIVE", "PAUSED", "CLOSED"]),
    opensAt: z.coerce.date(),
    closesAt: z.coerce.date(),
    images: z
      .array(
        z.object({
          src: z.string().trim().max(600),
          alt: z.string().trim().min(1).max(160),
          sortOrder: z.number().int().min(0).default(0),
        })
      )
      .max(8)
      .default([]),
  })
  .refine((d) => d.maxBid > d.minBid, { message: "maxBid must exceed minBid" })
  .refine((d) => d.closesAt > d.opensAt, { message: "closesAt must be after opensAt" });

export const creditAdjustSchema = z.object({
  userId: z.string().cuid(),
  amount: z.number().refine((n) => n !== 0, "Adjustment cannot be zero"),
  note: z.string().trim().min(3).max(300),
});

export const suspendSchema = z.object({
  userId: z.string().cuid(),
  suspended: z.boolean(),
  reason: z.string().trim().max(300).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  message: z.string().trim().min(10).max(2000),
});
