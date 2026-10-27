import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { auth } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "DemoBid — lowest-unique-bid DEMO",
  description:
    "DEMO application of a lowest-unique-bid competition platform. Demo credits only, no real payments.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <Navbar
          user={
            session?.user
              ? { name: session.user.name, email: session.user.email, role: (session.user as any).role }
              : null
          }
        />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
