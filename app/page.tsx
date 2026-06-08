import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";
import Mascot from "@/components/Mascot";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) redirect("/trips");

  const errorMsg = (() => {
    switch (searchParams.error) {
      case "not_invited":
        return "Diese E-Mail ist nicht auf der Liste. Frag den Admin, dass er dich einlädt.";
      case "auth_failed":
        return "Login hat nicht geklappt. Versuch's nochmal.";
      default:
        return null;
    }
  })();

  return (
    <main className="min-h-[100svh] flex flex-col">
      <header className="px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between shrink-0">
        <span className="serif text-2xl">Ferngänse</span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-ink/50">
          Privat · Weltweit
        </span>
      </header>

      <section className="flex-1 grid lg:grid-cols-[1.2fr_1fr] place-items-center gap-10 px-6 sm:px-10 py-6 sm:py-12 lg:py-20">
        <div className="max-w-xl rise hidden lg:block">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta font-semibold mb-5">
            Reiseideen sammeln, Trips planen
          </p>
          <h1 className="serif text-5xl sm:text-7xl leading-[0.95] mb-6">
            Wohin als Nächstes,
            <br />
            <em>wenn wir endlich los?</em>
          </h1>
          <p className="text-ink/70 text-lg max-w-md mb-8">
            Einzelne Ziele auf die Wishlist, ganze Trips zusammenstellen.
            Mit Karte, Route und der Crew, die mitkommt.
          </p>
          <p className="hand text-ink/60 text-2xl">Eine Karte. Ein Plan. Fernweh.</p>
        </div>

        <div className="lg:hidden text-center max-w-md rise">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta font-semibold mb-3">
            Privat · Weltweit
          </p>
          <h1 className="serif text-4xl leading-[0.95] mb-3">
            Wohin als Nächstes,
            <br />
            <em>wenn wir endlich los?</em>
          </h1>
        </div>

        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -top-12 -left-4 -rotate-6 hidden sm:block">
              <Mascot size={92} className="text-ink bob" />
            </div>

            <div className="bg-paper rounded-3xl shadow-sticker border border-ink/5 p-6 sm:p-8">
              {errorMsg && (
                <p className="text-sm text-rose mb-4 bg-rose/10 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}
              <LoginForm />
            </div>

            <p className="hand text-ink/50 text-lg mt-4 ml-2 -rotate-2 text-center sm:text-left">
              Nur für die Reise-Crew.
            </p>
          </div>
        </div>
      </section>

      <footer className="px-6 sm:px-10 py-4 text-xs text-ink/50 flex justify-between shrink-0">
        <span>Built with care · 2026</span>
        <span>Auth via Supabase</span>
      </footer>
    </main>
  );
}
