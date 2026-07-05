import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import type { OrderDoc } from "@/lib/types";

/**
 * Respaldo del webhook (RF-08): en local el webhook puede no llegar, así que
 * la página de éxito verifica la sesión de Stripe directamente. Usa el mismo
 * markOrderPaid idempotente, así que webhook y verify no duplican efectos.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id requerido" }, { status: 400 });

  const db = await getDb();
  const order = await db
    .collection<OrderDoc>("orders")
    .findOne({ stripeSessionId: sessionId, customerId: session.userId });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  if (order.status === "pending") {
    const checkout = await getStripe().checkout.sessions.retrieve(sessionId);
    if (checkout.payment_status === "paid") {
      await markOrderPaid(db, { _id: order._id });
      order.status = "paid";
    }
  }

  return NextResponse.json({ status: order.status, total: order.total });
}
