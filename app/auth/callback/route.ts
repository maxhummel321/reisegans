import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/trips";

  if (!code) return NextResponse.redirect(`${origin}/?error=auth_failed`);

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/?error=auth_failed`);

  // Check the shared invitation allowlist.
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email?.toLowerCase();
  if (email) {
    const { data: invitation } = await supabase
      .from("invitations")
      .select("id, display_name, claimed_by")
      .eq("email", email)
      .maybeSingle();

    if (!invitation) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/?error=not_invited`);
    }

    if (!invitation.claimed_by && userData.user) {
      await supabase
        .from("invitations")
        .update({ claimed_by: userData.user.id, claimed_at: new Date().toISOString() })
        .eq("id", invitation.id);

      await supabase
        .from("profiles")
        .update({ display_name: invitation.display_name })
        .eq("id", userData.user.id);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
