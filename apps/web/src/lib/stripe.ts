import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder", {
  apiVersion: "2024-06-20" as any,
  typescript: true,
});

interface CreateCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  userId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  };

  if (customerId) {
    params.customer = customerId;
  } else if (customerEmail) {
    params.customer_email = customerEmail;
  }

  return stripe.checkout.sessions.create(params);
}
