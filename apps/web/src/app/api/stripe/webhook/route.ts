import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret } from "@/lib/dashboard/secrets";

// Force dynamic + node runtime; we use node:crypto + the service-role key.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stripe webhook ingest.
 *
 * Flow:
 *   1. Look up the company by `account` from the event metadata (Connect)
 *      OR by X-Vibr-Company header set on the webhook URL (raw keys mode).
 *   2. Pull the stored whsec_… secret for that company.
 *   3. Verify signature, upsert a row in company_revenue.
 *
 * This route uses the Supabase *service role* client because the RLS check
 * would otherwise fail (the caller is Stripe, not a user).
 *
 * IMPORTANT: the admin client is lazy-initialized so the module can be
 * imported at build time without the env vars present (Next's "Collecting
 * page data" step would otherwise crash with `supabaseUrl is required`).
 */

let cachedAdmin: SupabaseClient | null = null;
function getAdminClient(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Stripe webhook requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  cachedAdmin = createClient(url, key, { auth: { persistSession: false } });
  return cachedAdmin;
}

// Stripe's sig header format: `t=<ts>,v1=<hmac>`.
function verify(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=").map((s) => s.trim()))
  );
  if (!parts.t || !parts.v1) return false;
  const signed = `${parts.t}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signed, "utf8")
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(parts.v1, "utf8")
  );
}

export async function POST(request: Request) {
  const raw = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";
  const companyId = request.headers.get("x-vibr-company");

  if (!companyId) {
    return NextResponse.json({ error: "Missing X-Vibr-Company header" }, { status: 400 });
  }

  const { data: integration } = await getAdminClient()
    .from("company_integrations")
    .select("encrypted_keys")
    .eq("company_id", companyId)
    .eq("provider", "stripe")
    .maybeSingle();

  if (!integration?.encrypted_keys?.webhook_secret) {
    return NextResponse.json(
      { error: "Stripe webhook secret not configured." },
      { status: 404 }
    );
  }

  let secret: string;
  try {
    secret = decryptSecret(integration.encrypted_keys.webhook_secret);
  } catch {
    return NextResponse.json({ error: "Secret decryption failed." }, { status: 500 });
  }

  if (!verify(raw, sig, secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle money-affecting events in v1.
  const KIND_MAP: Record<string, "payment" | "refund" | "payout"> = {
    "charge.succeeded": "payment",
    "payment_intent.succeeded": "payment",
    "charge.refunded": "refund",
    "payout.paid": "payout",
  };
  const kind = KIND_MAP[event.type];
  if (!kind) return NextResponse.json({ ok: true, ignored: event.type });

  const obj = event.data?.object ?? {};
  const amount = obj.amount_received ?? obj.amount ?? 0;
  const currency = (obj.currency ?? "usd").toUpperCase();
  const signedAmount = kind === "refund" ? -Math.abs(amount) : amount;

  const { error } = await getAdminClient().from("company_revenue").upsert(
    {
      company_id: companyId,
      source: "stripe",
      external_id: event.id,
      amount_cents: signedAmount,
      currency,
      kind,
      occurred_at: new Date((event.created ?? Date.now() / 1000) * 1000).toISOString(),
      raw: event,
    },
    { onConflict: "company_id,source,external_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await getAdminClient().from("company_audit_log").insert({
    company_id: companyId,
    action: "stripe.ingest",
    payload: { event_type: event.type, external_id: event.id },
  });

  return NextResponse.json({ ok: true });
}
