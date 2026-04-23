import { NextResponse } from "next/server";
import { requireCompany, logAudit } from "@/lib/dashboard/api-helpers";

export async function POST(request: Request) {
  const ctx = await requireCompany({ require: "write" });
  if (ctx.error) return ctx.error;
  const { supabase, company, user } = ctx;

  const body = await request.json().catch(() => ({}));
  const amountCents = Number(body.amount_cents);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: "amount_cents must be > 0." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("company_expenses")
    .insert({
      company_id: company.id,
      amount_cents: Math.round(amountCents),
      currency: typeof body.currency === "string" ? body.currency : "USD",
      vendor: typeof body.vendor === "string" && body.vendor ? body.vendor : null,
      category:
        typeof body.category === "string" && body.category ? body.category : null,
      occurred_on:
        typeof body.occurred_on === "string" && body.occurred_on
          ? body.occurred_on
          : new Date().toISOString().slice(0, 10),
      notes: typeof body.notes === "string" ? body.notes : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit(supabase, company.id, user!.id, "expense.create", {
    amount_cents: amountCents,
    vendor: body.vendor,
  });
  return NextResponse.json({ expense: data });
}
