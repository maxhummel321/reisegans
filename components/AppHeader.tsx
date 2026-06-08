"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shared top navigation: brand on the left, two equal tabs (Trips / Ideen) and
 * a small sign-out form on the right. Trips and Destinations are first-class
 * peers — neither is "inside" the other.
 */
export default function AppHeader() {
  const pathname = usePathname() ?? "";
  const onTrips = pathname.startsWith("/trips");
  const onIdeas = pathname.startsWith("/destinations");

  return (
    <header className="sticky top-0 z-30 bg-cream/80 backdrop-blur border-b border-ink/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link href="/trips" className="serif text-xl shrink-0">
          Reisegans
        </Link>
        <nav className="flex items-center gap-1">
          <Tab href="/trips" active={onTrips}>
            Trips
          </Tab>
          <Tab href="/destinations" active={onIdeas}>
            Ideen
          </Tab>
        </nav>
        <form action="/auth/signout" method="post" className="ml-auto">
          <button
            className="text-xs text-ink/55 hover:text-ink underline"
            aria-label="Abmelden"
          >
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
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition " +
        (active ? "bg-ink text-cream" : "text-ink/65 hover:text-ink")
      }
    >
      {children}
    </Link>
  );
}
