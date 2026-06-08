"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step =
  | { kind: "email" }
  | { kind: "claim"; email: string; displayName: string }
  | { kind: "login"; email: string; displayName: string }
  | { kind: "magic-sent"; email: string }
  | { kind: "rejected"; email: string };

const HOME = "/trips";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<Step>({ kind: "email" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setStep({ kind: "email" });
    setError("");
  }

  async function handleEmail(email: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/email-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      const lower = email.trim().toLowerCase();

      if (data.status === "not-invited") {
        setStep({ kind: "rejected", email: lower });
      } else if (data.status === "invited-unclaimed") {
        setStep({ kind: "claim", email: lower, displayName: data.displayName ?? "" });
      } else if (data.status === "invited-claimed") {
        setStep({ kind: "login", email: lower, displayName: data.displayName ?? "" });
      } else {
        setError("Hm, da hat was nicht geklappt. Versuch's nochmal.");
      }
    } catch {
      setError("Verbindung gestört. Internet da?");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim(password: string) {
    if (step.kind !== "claim") return;
    setBusy(true);
    setError("");
    const { error: signUpErr } = await supabase.auth.signUp({
      email: step.email,
      password,
    });
    if (signUpErr) {
      setBusy(false);
      setError(translate(signUpErr.message));
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      router.push(HOME);
      router.refresh();
      return;
    }
    const { error: pwErr } = await supabase.auth.signInWithPassword({
      email: step.email,
      password,
    });
    setBusy(false);
    if (pwErr) {
      setError(translate(pwErr.message));
      return;
    }
    router.push(HOME);
    router.refresh();
  }

  async function handleLogin(password: string) {
    if (step.kind !== "login") return;
    setBusy(true);
    setError("");
    const { error: pwErr } = await supabase.auth.signInWithPassword({
      email: step.email,
      password,
    });
    setBusy(false);
    if (pwErr) {
      setError(translate(pwErr.message));
      return;
    }
    router.push(HOME);
    router.refresh();
  }

  async function sendMagic() {
    if (step.kind !== "login") return;
    setBusy(true);
    setError("");
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: step.email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    });
    setBusy(false);
    if (otpErr) {
      setError(translate(otpErr.message));
      return;
    }
    setStep({ kind: "magic-sent", email: step.email });
  }

  if (step.kind === "rejected") {
    return (
      <div className="text-center py-2">
        <p className="hand text-2xl mb-2">Mh.</p>
        <p className="serif text-2xl mb-3">
          <strong>{step.email}</strong> steht nicht auf der Liste.
        </p>
        <p className="text-ink/60 text-sm mb-5">
          Frag den Admin, dass er dich einlädt. Dann probierst du&apos;s nochmal.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-ink text-cream px-5 py-2.5 font-medium hover:bg-terracotta transition"
        >
          Andere E-Mail
        </button>
      </div>
    );
  }

  if (step.kind === "magic-sent") {
    return (
      <div className="text-center py-2">
        <p className="hand text-2xl mb-2">Geschickt.</p>
        <p className="serif text-2xl mb-3">Schau ins Postfach.</p>
        <p className="text-ink/60 text-sm mb-5">
          Magic Link ist auf dem Weg an <strong>{step.email}</strong>.
          Einmal klicken, drin.
        </p>
        <button onClick={reset} className="text-sm text-ink/55 hover:text-ink underline">
          Doch lieber Passwort?
        </button>
      </div>
    );
  }

  if (step.kind === "claim") {
    return (
      <ClaimStep
        email={step.email}
        displayName={step.displayName}
        busy={busy}
        error={error}
        onSubmit={handleClaim}
        onBack={reset}
      />
    );
  }

  if (step.kind === "login") {
    return (
      <LoginStep
        email={step.email}
        displayName={step.displayName}
        busy={busy}
        error={error}
        onSubmit={handleLogin}
        onForgot={sendMagic}
        onBack={reset}
      />
    );
  }

  return <EmailStep busy={busy} error={error} onSubmit={handleEmail} />;
}

function EmailStep({
  busy,
  error,
  onSubmit,
}: {
  busy: boolean;
  error: string;
  onSubmit: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email);
      }}
      className="space-y-3"
    >
      <label className="block text-xs uppercase tracking-[0.18em] text-ink/60 mb-1">
        Wer reist mit?
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="du@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-xl bg-cream border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition"
        />
        <button
          type="submit"
          disabled={busy}
          className="tap rounded-xl bg-ink text-cream px-5 py-3 font-medium hover:bg-terracotta transition disabled:opacity-60"
        >
          {busy ? "Schau nach …" : "Weiter"}
        </button>
      </div>
      {error && <p className="text-rose text-sm">{error}</p>}
      <p className="text-xs text-ink/50">
        Wir checken nur, ob du auf der Liste stehst — kein Spam, kein Tracking.
      </p>
    </form>
  );
}

function ClaimStep({
  email,
  displayName,
  busy,
  error,
  onSubmit,
  onBack,
}: {
  email: string;
  displayName: string;
  busy: boolean;
  error: string;
  onSubmit: (password: string) => void;
  onBack: () => void;
}) {
  const [password, setPassword] = useState("");
  const greeting = displayName ? `Servus, ${displayName}!` : "Servus!";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password);
      }}
      className="space-y-3 float-in"
    >
      <p className="hand text-2xl text-ink/80">{greeting}</p>
      <p className="serif text-2xl">Pack die Koffer.</p>
      <p className="text-ink/65 text-sm">
        Such dir ein Passwort aus, dann bist du drin. Beim nächsten Mal reicht das.
      </p>
      <input
        type="email"
        value={email}
        readOnly
        className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink/60 text-sm"
      />
      <input
        type="password"
        required
        autoFocus
        minLength={6}
        autoComplete="new-password"
        placeholder="Passwort wählen (min. 6 Zeichen)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl bg-cream border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition"
      />
      <button
        type="submit"
        disabled={busy}
        className="tap w-full rounded-xl bg-ink text-cream py-3 font-medium hover:bg-terracotta transition disabled:opacity-60"
      >
        {busy ? "Lege an …" : "Loslegen"}
      </button>
      {error && <p className="text-rose text-sm">{error}</p>}
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-ink/50 hover:text-ink underline"
      >
        Andere E-Mail
      </button>
    </form>
  );
}

function LoginStep({
  email,
  displayName,
  busy,
  error,
  onSubmit,
  onForgot,
  onBack,
}: {
  email: string;
  displayName: string;
  busy: boolean;
  error: string;
  onSubmit: (password: string) => void;
  onForgot: () => void;
  onBack: () => void;
}) {
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password);
      }}
      className="space-y-3 float-in"
    >
      <p className="hand text-2xl text-ink/80">
        Hi{displayName ? ", " + displayName : ""}!
      </p>
      <p className="serif text-2xl">Willkommen zurück.</p>
      <input
        type="email"
        value={email}
        readOnly
        className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink/60 text-sm"
      />
      <input
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl bg-cream border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition"
      />
      <button
        type="submit"
        disabled={busy}
        className="tap w-full rounded-xl bg-ink text-cream py-3 font-medium hover:bg-terracotta transition disabled:opacity-60"
      >
        {busy ? "Login läuft …" : "Einloggen"}
      </button>
      {error && <p className="text-rose text-sm">{error}</p>}
      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={onBack} className="text-ink/50 hover:text-ink underline">
          Andere E-Mail
        </button>
        <button
          type="button"
          onClick={onForgot}
          disabled={busy}
          className="text-ink/55 hover:text-ink underline"
        >
          Passwort vergessen?
        </button>
      </div>
    </form>
  );
}

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Passwort stimmt nicht.";
  if (m.includes("email rate limit"))
    return "Zu viele Mails — versuch's in einer Stunde noch mal.";
  if (m.includes("user already registered"))
    return "Account gibt's schon. Geh zurück und log dich ein.";
  if (m.includes("password should be at least"))
    return "Passwort braucht mindestens 6 Zeichen.";
  if (m.includes("for security purposes"))
    return "Kurz warten, dann nochmal — Supabase macht eine kleine Pause.";
  return msg;
}
