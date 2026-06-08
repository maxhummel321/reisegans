import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSdkClient } from "@supabase/supabase-js";

// POST /api/auth/email-check  { email: string }
// -> { status: "invited-unclaimed" | "invited-claimed" | "not-invited",
//      displayName?: string }
//
// Public endpoint (no auth) — needed *before* login. Shares the same
// invitations allowlist as Gänsemünchen (same Supabase project).

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "missing email" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "service not configured" }, { status: 500 });
  }

  const admin = createSdkClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: invitation } = await admin
    .from("invitations")
    .select("display_name, claimed_by, claimed_at")
    .eq("email", email)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ status: "not-invited" });
  }

  const claimed = !!invitation.claimed_by || !!invitation.claimed_at;

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return NextResponse.json({
    status: claimed || profile ? "invited-claimed" : "invited-unclaimed",
    displayName: invitation.display_name,
  });
}
