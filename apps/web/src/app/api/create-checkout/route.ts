import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", user.id)
      .single();

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
    }

    const session = await createCheckoutSession({
      priceId,
      customerId: profile?.stripe_customer_id || undefined,
      customerEmail: profile?.email || user.email || undefined,
      userId: user.id,
      successUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "https://vibr-blush.vercel.app" : "http://localhost:3000"}/dashboard?checkout=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "https://vibr-blush.vercel.app" : "http://localhost:3000"}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
