import type { Db } from "mongodb";

/** Índices del modelo de datos (PROMPT.md §6). Usado por el seed y los tests. */
export async function ensureIndexes(db: Db): Promise<void> {
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("products").createIndex({ active: 1, category: 1 });
  await db.collection("orders").createIndex({ customerId: 1 });
  await db
    .collection("orders")
    .createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true });
  await db.collection("carts").createIndex({ customerId: 1 }, { unique: true });
}
