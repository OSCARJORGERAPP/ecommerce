import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { canTransition } from "@/lib/format";
import type { OrderDoc, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "cancelled"];

/** RF-13: cambio de estado con validación de transiciones. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Id inválido" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const status = body?.status as OrderStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const db = await getDb();
  const order = await db.collection<OrderDoc>("orders").findOne({ _id: new ObjectId(id) });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  if (!canTransition(order.status, status)) {
    return NextResponse.json(
      { error: `Transición no permitida: ${order.status} → ${status}` },
      { status: 400 }
    );
  }

  await db
    .collection<OrderDoc>("orders")
    .updateOne({ _id: order._id }, { $set: { status } });
  return NextResponse.json({ ok: true });
}
