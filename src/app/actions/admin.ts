"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { submitBid } from "@/services/bids";
import { bidSchema, drawUpsertSchema, suspendSchema } from "@/lib/validation";
import { settleDraw } from "@/services/results";
import { adminAdjustCredits } from "@/services/credits";
import { prisma } from "@/lib/db";

async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as { id: string };
}

async function requireAdmin() {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string; role?: string } | undefined;
  if (!u?.id || !u?.email || u.role !== "ADMIN") return null;
  const dbUser = await prisma.user.findUnique({ where: { id: u.id } });
  if (!dbUser || dbUser.role !== "ADMIN" || dbUser.suspended) return null;
  return { id: dbUser.id, email: dbUser.email };
}

export async function placeBidAction(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  if (!user) return { error: "You must be logged in to place a bid." };

  const parsed = bidSchema.safeParse({
    drawId: formData.get("drawId"),
    amount: Number(formData.get("amount")),
  });
  if (!parsed.success) return { error: "Bid amount must be a positive number within the draw limits." };

  const res = await submitBid(user.id, parsed.data.drawId, parsed.data.amount);
  if (!res.ok) return { error: res.error };
  revalidatePath("/draws");
  return { ok: true, balanceAfter: res.balanceAfter };
}

export async function settleDrawAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden" };
  const res = await settleDraw({ id: admin.id, email: admin.email }, String(formData.get("drawId") || ""));
  if (!res.ok) return { error: res.error };
  revalidatePath("/admin/results");
  return { ok: true, hasWinner: res.hasWinner, winnerEmail: res.winnerEmail, winningAmount: res.winningAmount };
}

export async function creditAdjustAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden" };
  try {
    await adminAdjustCredits(
      { id: admin.id, email: admin.email },
      {
        userId: formData.get("userId"),
        amount: Number(formData.get("amount")),
        note: formData.get("note"),
      }
    );
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Adjustment failed" };
  }
}

export async function suspendUserAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden" };

  const parsed = suspendSchema.safeParse({
    userId: formData.get("userId"),
    suspended: formData.get("suspended") === "true",
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: "Invalid suspend request" };

  const action = parsed.data.suspended ? "user.suspend" : "user.reactivate";
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        suspended: parsed.data.suspended,
        suspendReason: parsed.data.suspended ? (parsed.data.reason ?? "Suspended by admin") : null,
      },
    });
    await tx.adminAuditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action,
        targetType: "user",
        targetId: parsed.data.userId,
        details: JSON.stringify(parsed.data.reason ?? null),
      },
    });
  });
  revalidatePath("/admin/users");
  return { ok: true, action };
}

export async function drawUpsertAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Forbidden" };

  const images: { src: string; alt: string; sortOrder: number }[] = [];
  for (let i = 1; i <= 3; i++) {
    const src = formData.get(`image${i}src`);
    const alt = formData.get(`image${i}alt`);
    if (src && alt) images.push({ src: String(src), alt: String(alt), sortOrder: i });
  }

  const parsed = drawUpsertSchema.safeParse({
    ...(formData.get("id") ? { id: formData.get("id") } : {}),
    slug: formData.get("slug"),
    title: formData.get("title"),
    prizeName: formData.get("prizeName"),
    description: formData.get("description"),
    currency: formData.get("currency") || undefined,
    bidPrecision: Number(formData.get("bidPrecision")),
    minBid: Number(formData.get("minBid")),
    maxBid: Number(formData.get("maxBid")),
    bidCreditFee: Number(formData.get("bidCreditFee")),
    status: formData.get("status"),
    opensAt: formData.get("opensAt"),
    closesAt: formData.get("closesAt"),
    images,
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };

  const data = parsed.data;
  const exists = await prisma.draw.findUnique({ where: { slug: data.slug } });

  await prisma.$transaction(async (tx) => {
    if (exists) {
      await tx.draw.update({ where: { slug: data.slug }, data });
      if (images.length) {
        await tx.prizeImage.deleteMany({ where: { drawId: exists.id } });
        await tx.prizeImage.createMany({ data: images.map((im) => ({ ...im, drawId: exists.id })) });
      }
    } else {
      await tx.draw.create({
        data: {
          ...data,
          prizeImages: { create: images.map((im) => ({ ...im })) },
        },
      });
    }
    await tx.adminAuditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: exists ? "draw.edit" : "draw.create",
        targetType: "draw",
        targetId: data.slug,
        details: JSON.stringify({ status: data.status }),
      },
    });
  });
  revalidatePath("/admin/draws");
  return { ok: true, slug: data.slug };
}
