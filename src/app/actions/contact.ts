"use server";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { DemoCreditTransaction, AdminAuditLog } from "@prisma/client";

export async function contactAction(_prev: unknown, formData: FormData) {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please provide a name, valid email, and message of at least 10 characters." };
  }
  // DEMO: log to audit trail; no outbound email is sent.
  await prisma.adminAuditLog.create({
    data: {
      actorId: null,
      actorEmail: parsed.data.email,
      action: "contact.message",
      targetType: "contact",
      targetId: parsed.data.name,
      details: JSON.stringify({ messageLength: parsed.data.message.length }),
    },
  });
  return { ok: true };
}
