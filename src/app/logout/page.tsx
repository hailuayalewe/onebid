import { signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LogoutPage() {
  await signOut({ redirectTo: "/login" });
}
