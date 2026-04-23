import { NextResponse } from "next/server";
import { requireCompany, logAudit } from "@/lib/dashboard/api-helpers";
import { encryptSecret, fingerprint } from "@/lib/dashboard/secrets";

const ALLOWED_PROVIDERS = new Set([
  "stripe",
  "resend",
  "google",
  "supabase",
  "custom",
]);

export async function POST(request: Request) {
  const ctx = await requireCompany({ require: "write" });
  if (ctx.error) return ctx.error;
  const { supabase, company, user } = ctx;

  const body = await request.json().catch(() => ({}));
  const provider = typeof body.provider === "string" ? body.provider : "";
  const secrets =
    body.secrets && typeof body.secrets === "object" ? body.secrets : {};

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }

  // Split into encrypted (secret) keys and plaintext metadata.
  // Each value is treated as a secret except known-public fields.
  const PUBLIC_KEYS = new Set(["project_url", "label"]);
  const encrypted: Record<string, string> = {};
  const metadata: Record<string, string> = {};

  for (const [key, raw] of Object.entries(secrets)) {
    if (typeof raw !== "string" || !raw) continue;
    if (PUBLIC_KEYS.has(key)) {
      metadata[key] = raw;
    } else {
      try {
        encrypted[key] = encryptSecret(raw);
        metadata[`${key}_fingerprint`] = fingerprint(raw);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message ?? "Encryption failed." },
          { status: 500 }
        );
      }
    }
  }

  const { error } = await supabase
    .from("company_integrations")
    .upsert(
      {
        company_id: company.id,
        provider,
        status: "connected",
        encrypted_keys: encrypted,
        metadata,
      },
      { onConflict: "company_id,provider" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, company.id, user!.id, "integration.save", {
    provider,
    fields: Object.keys(metadata),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ctx = await requireCompany({ require: "write" });
  if (ctx.error) return ctx.error;
  const { supabase, company, user } = ctx;

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  if (!provider) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("company_integrations")
    .delete()
    .eq("company_id", company.id)
    .eq("provider", provider);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit(supabase, company.id, user!.id, "integration.remove", {
    provider,
  });
  return NextResponse.json({ ok: true });
}
