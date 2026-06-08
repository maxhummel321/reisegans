#!/usr/bin/env node
/**
 * RLS verification for the tp_* tables (Task 2.4).
 *
 * Uses the service-role key to create two ephemeral auth users (Alice + Bob),
 * impersonates each via short-lived JWTs, and verifies the key invariants:
 *
 *   1. Alice creates a trip; Bob (not a companion) cannot see it at all.
 *   2. Alice is automatically the owner of her trip (Trigger).
 *   3. Bob cannot insert spots into Alice's trip.
 *   4. Alice adds Bob as companion → Bob can now read the trip.
 *   5. Destinations are globally readable.
 *
 * Cleans up the ephemeral users at the end. SAFE TO RUN against prod.
 *
 * Usage: node scripts/verify-rls.mjs   (reads .env.local)
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- load env from .env.local --------------------------------------------
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) {
  console.error("Missing env (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY)");
  process.exit(1);
}

const admin = createClient(URL_, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tag = `tp-rls-${Date.now()}`;
const aliceEmail = `${tag}-alice@example.test`;
const bobEmail = `${tag}-bob@example.test`;
const password = "rls-test-password-1234";

let aliceId, bobId;
const failures = [];
function check(label, ok) {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}`);
    failures.push(label);
  }
}

async function asUser(email) {
  const { data, error } = await admin.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in for ${email}: ${error.message}`);
  return createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    },
  });
}

async function setupUsers() {
  // The Gänsemünchen auth.users insert trigger requires the email to be on
  // the invitations allowlist. Add temporary invitations for Alice + Bob.
  for (const email of [aliceEmail, bobEmail]) {
    await admin
      .from("invitations")
      .upsert({ email, display_name: email.split("@")[0] }, { onConflict: "email" });
  }
  for (const email of [aliceEmail, bobEmail]) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`create user ${email}: ${error.message}`);
    if (email === aliceEmail) aliceId = data.user.id;
    else bobId = data.user.id;
  }
}

async function cleanup() {
  try {
    if (aliceId) await admin.auth.admin.deleteUser(aliceId);
  } catch {}
  try {
    if (bobId) await admin.auth.admin.deleteUser(bobId);
  } catch {}
  await admin.from("invitations").delete().in("email", [aliceEmail, bobEmail]);
}

(async () => {
  console.log("Setting up ephemeral test users …");
  try {
    await setupUsers();
  } catch (err) {
    console.error("Setup failed:", err.message);
    await cleanup();
    process.exit(1);
  }

  try {
    const alice = await asUser(aliceEmail);
    const bob = await asUser(bobEmail);

    console.log("\nProperty 5 — Destinations: global read");
    const { error: dInsErr, data: dRow } = await alice
      .from("tp_destinations")
      .insert({ title: `${tag}-dest`, created_by: aliceId, created_by_name: "Alice" })
      .select("id")
      .single();
    check("Alice creates destination", !dInsErr);
    const { data: bobSeesDest } = await bob
      .from("tp_destinations")
      .select("id")
      .eq("id", dRow?.id ?? "0");
    check("Bob can read Alice's destination (global)", (bobSeesDest ?? []).length === 1);

    console.log("\nProperties 1+2+3 — Trip isolation, owner trigger, edit rights");
    const { data: trip, error: tInsErr } = await alice
      .from("tp_trips")
      .insert({ title: `${tag}-trip`, created_by: aliceId, created_by_name: "Alice" })
      .select("id")
      .single();
    check("Alice creates trip", !tInsErr);
    const tripId = trip?.id;

    // Owner trigger
    const { data: ownerRow } = await admin
      .from("tp_trip_companions")
      .select("user_id, role")
      .eq("trip_id", tripId)
      .eq("user_id", aliceId)
      .maybeSingle();
    check("Alice is automatically owner (Property 2)", ownerRow?.role === "owner");

    // Bob cannot read Alice's trip
    const { data: bobTrips } = await bob.from("tp_trips").select("id").eq("id", tripId);
    check("Bob cannot read Alice's trip (Property 1)", (bobTrips ?? []).length === 0);

    // Bob cannot insert a spot for it
    const { error: bobSpotErr } = await bob.from("tp_trip_spots").insert({
      trip_id: tripId,
      title: "sneaky",
      created_by: bobId,
    });
    check("Bob cannot insert spot into Alice's trip (Property 3)", !!bobSpotErr);

    // Alice invites Bob
    const { error: addErr } = await alice.from("tp_trip_companions").insert({
      trip_id: tripId,
      user_id: bobId,
      role: "editor",
      added_by: aliceId,
    });
    check("Alice can add Bob as editor", !addErr);

    // Bob now sees the trip
    const { data: bobTripsAfter } = await bob.from("tp_trips").select("id").eq("id", tripId);
    check("Bob can read trip after invitation", (bobTripsAfter ?? []).length === 1);

    // Bob can now insert a spot
    const { error: spotOkErr } = await bob.from("tp_trip_spots").insert({
      trip_id: tripId,
      title: "Bob's spot",
      created_by: bobId,
      sort_order: 0,
    });
    check("Bob (as editor) can insert spot", !spotOkErr);

    // Cleanup the trip + dest under admin to bypass any FK weirdness
    if (tripId) await admin.from("tp_trips").delete().eq("id", tripId);
    if (dRow?.id) await admin.from("tp_destinations").delete().eq("id", dRow.id);
  } finally {
    await cleanup();
  }

  if (failures.length > 0) {
    console.error(`\n✗ ${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log("\n✓ All RLS properties hold.");
})().catch(async (err) => {
  console.error(err);
  await cleanup();
  process.exit(1);
});
