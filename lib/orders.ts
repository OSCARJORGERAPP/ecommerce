import { ObjectId, type Db, type Filter } from "mongodb";
import type { CartDoc, OrderDoc, ProductDoc } from "./types";

/**
 * Marca un pedido pending → paid de forma IDEMPOTENTE (el filtro exige
 * status "pending", así que los reintentos del webhook no repiten efectos).
 * Al confirmarse por primera vez: vacía el carrito del cliente y descuenta
 * el stock vendido (nunca por debajo de 0).
 * Devuelve true solo si esta llamada realizó la transición.
 */
export async function markOrderPaid(
  db: Db,
  filter: Filter<OrderDoc>
): Promise<boolean> {
  const order = await db
    .collection<OrderDoc>("orders")
    .findOneAndUpdate(
      { ...filter, status: "pending" },
      { $set: { status: "paid" } }
    );
  if (!order) return false;

  await db
    .collection<CartDoc>("carts")
    .updateOne(
      { customerId: order.customerId },
      { $set: { items: [], updatedAt: new Date() } }
    );

  for (const item of order.items) {
    if (!ObjectId.isValid(item.productId)) continue;
    await db.collection<ProductDoc>("products").updateOne(
      { _id: new ObjectId(item.productId) },
      // Update con pipeline: floor en 0 para no dejar stock negativo
      [{ $set: { stock: { $max: [0, { $subtract: ["$stock", item.qty] }] } } }]
    );
  }
  return true;
}
