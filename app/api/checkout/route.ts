import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { cartTotal } from "@/lib/format";
import type { CartDoc, OrderDoc } from "@/lib/types";

/**
 * RF-07: crea un pedido `pending` desde el carrito y una Stripe Checkout
 * Session. El pedido se marcará `paid` vía webhook (RF-08).
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const db = await getDb();
  const cart = await db.collection<CartDoc>("carts").findOne({ customerId: session.userId });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  const order: OrderDoc = {
    customerId: session.userId,
    items: cart.items,
    total: cartTotal(cart.items),
    status: "pending",
    createdAt: new Date(),
  };
  const { insertedId } = await db.collection<OrderDoc>("orders").insertOne(order);

  const origin = new URL(request.url).origin;
  const stripe = getStripe();
  let checkout;
  try {
    checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: cart.items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: item.price, // céntimos: Stripe usa la misma unidad
        },
        quantity: item.qty,
      })),
      metadata: { orderId: insertedId.toString() },
      customer_email: session.email,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });
  } catch (err) {
    // Si Stripe falla, no dejar un pedido pending huérfano (RETROSPECTIVA)
    await db.collection<OrderDoc>("orders").deleteOne({ _id: insertedId });
    console.error("Stripe checkout falló:", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 502 });
  }

  await db
    .collection<OrderDoc>("orders")
    .updateOne({ _id: insertedId }, { $set: { stripeSessionId: checkout.id } });

  return NextResponse.json({ url: checkout.url });
}
