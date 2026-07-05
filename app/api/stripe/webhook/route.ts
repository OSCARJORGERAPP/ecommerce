import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";

/**
 * RF-08: Stripe llama aquí al completarse el pago. Se verifica la FIRMA del
 * evento (nunca confiar en el body sin verificar) y se marca el pedido como
 * `paid` vía markOrderPaid — idempotente: los reintentos de Stripe no
 * duplican efectos (ni vaciado de carrito ni descuento de stock).
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Firma o secreto ausentes" }, { status: 400 });
  }

  // El body crudo es imprescindible para verificar la firma
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const orderId = event.data.object.metadata?.orderId;
    if (orderId && ObjectId.isValid(orderId)) {
      const db = await getDb();
      await markOrderPaid(db, { _id: new ObjectId(orderId) });
    }
  }

  return NextResponse.json({ received: true });
}
