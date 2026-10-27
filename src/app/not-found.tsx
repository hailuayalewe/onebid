import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="py-20 text-center space-y-4">
      <Compass className="mx-auto text-amber-600" size={48} />
      <h1 className="text-4xl font-extrabold">404</h1>
      <p className="text-slate-600">We couldn’t find that page or draw.</p>
      <Link href="/" className="inline-block rounded-md bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700">
        Back to homepage
      </Link>
    </div>
  );
}
