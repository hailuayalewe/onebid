"use server";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hash } from "@node-rs/argon2";
import { registerSchema } from "@/lib/validation";
import { startingDemoCredits } from "@/services/credits";

export async function registerAction(_prev: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check your details (name, email, password of at least 8 characters)." };
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const starting = startingDemoCredits();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword: await hash(password),
      creditBalance: starting,
    },
  });
  if (starting > 0) {
    await prisma.demoCreditTransaction.create({
      data: { userId: user.id, type: "AWARD", amount: starting, balanceAfter: starting, note: "Starting demo balance" },
    });
  }  await signIn("demo-credentials", { email, password }, { redirectTo: "/account/profile" });
}

export async function loginAction(_prev: unknown, formData: FormData) {
  try {
    await signIn("demo-credentials", Object.fromEntries(formData), { redirectTo: "/account/profile" });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Invalid email or password, or the account is suspended." };
    }
    throw e;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
