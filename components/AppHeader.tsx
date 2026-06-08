"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Shared top navigation with three primary sections:
 *   Rundreisen   → /trips (trips without the city-trip tag)
 *   Städtetrips  → /trips?art=stadt (trips tagged "staedtetrip")
 *   Wellness     → /destinations (single ideas / wellness hotels)
 */
export default function AppHeader() {
  const pathname = usePathname() ?? "";
  const params = useSearchParams();
  const art = params?.get("art");

  const onTrips = pathname.startsWith("/trips");
  const onIdeas = pathname.startsWith("/destinations");

  const onRund = onTrips && art !== "stadt";
  const onStadt = onTrips && art === "stadt";

  return (
    <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur border-b border-ink/5 sun-band">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link href="/trips" className="serif text-xl shrink-0 mr-1">
          <span aria-hidden className="mr-1">🧭</span>Reisegans
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Tab href="/trips" active={onRund}>
            Rundreisen
          </Tab>
          <Tab href="/trips?art=stadt" active={onStadt}>
            Städtetrips
          </Tab>
          <Tab href="/destinations" active={onIdeas}>
            Wellness
          </Tab>
        </nav>
        <form action="/auth/signout" method="post" className="ml-auto shrink-0">
          <button className="text-xs text-ink/55 hover:text-ink underline" aria-label="Abmelden">
            Abmelden
          </button>
        </form>
      </div>
    </header>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition " +
        (active ? "bg-ink text-cream" : "text-ink/65 hover:text-ink")
      }
    >
      {children}
    </Link>
  );
}
