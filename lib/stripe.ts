import Stripe from "stripe";

// Cliente lazy: no instanciar en el top-level (ver lib/db.ts y AGENTS.md).
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY no configurado");
    stripe = new Stripe(key);
  }
  return stripe;
}
