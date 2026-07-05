// Tests de integración contra MongoDB local (RF-01, RF-06, RF-08, RF-13, RF-14).
// Se saltan limpiamente si no hay MongoDB (p. ej. runner de CI).
// OJO (RETROSPECTIVA): it.skipIf recibe un BOOLEANO y se evalúa en la fase de
// colección, antes de beforeAll → la conexión se abre en la carga del módulo.
import { afterAll, describe, expect, it } from "vitest";
import { MongoClient, MongoServerError, type Db } from "mongodb";
import { ensureIndexes } from "@/lib/indexes";
import { cartTotal } from "@/lib/format";
import { markOrderPaid } from "@/lib/orders";
import type { CartDoc, OrderDoc, ProductDoc, UserDoc } from "@/lib/types";

let client: MongoClient | null = null;
let db: Db | null = null;
try {
  client = await new MongoClient(
    process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017",
    { serverSelectionTimeoutMS: 1500 }
  ).connect();
  db = client.db("ecommerce_test");
  await db.dropDatabase();
  await ensureIndexes(db);
} catch {
  client = null;
  db = null;
}

afterAll(async () => {
  if (db) await db.dropDatabase();
  await client?.close();
});

describe("integración MongoDB", () => {
  it.skipIf(!db)("el índice único de email rechaza duplicados (RF-01)", async () => {
    const users = db!.collection<UserDoc>("users");
    const user: UserDoc = {
      email: "dup@test.dev",
      passwordHash: "x",
      role: "customer",
      name: "Dup",
      createdAt: new Date(),
    };
    await users.insertOne({ ...user });
    await expect(users.insertOne({ ...user, _id: undefined })).rejects.toSatisfy(
      (err) => err instanceof MongoServerError && err.code === 11000
    );
  });

  it.skipIf(!db)("el carrito se upserta y persiste por cliente (RF-06)", async () => {
    const carts = db!.collection<CartDoc>("carts");
    const customerId = "cliente-1";
    const item = { productId: "p1", name: "Teclado", price: 8999, qty: 2 };

    // upsert inicial + actualización, como hace POST /api/cart
    await carts.updateOne(
      { customerId },
      { $set: { items: [item], updatedAt: new Date() } },
      { upsert: true }
    );
    await carts.updateOne(
      { customerId },
      { $set: { items: [{ ...item, qty: 3 }], updatedAt: new Date() } },
      { upsert: true }
    );

    const cart = await carts.findOne({ customerId });
    expect(cart!.items).toHaveLength(1);
    expect(cart!.items[0].qty).toBe(3);
    expect(cartTotal(cart!.items)).toBe(26997);
    // Índice único: un solo carrito por cliente
    expect(await carts.countDocuments({ customerId })).toBe(1);
  });

  it.skipIf(!db)(
    "markOrderPaid es idempotente y descuenta stock sin bajar de 0 (RF-08)",
    async () => {
      const products = db!.collection<ProductDoc>("products");
      const orders = db!.collection<OrderDoc>("orders");
      const carts = db!.collection<CartDoc>("carts");

      const { insertedId: productId } = await products.insertOne({
        name: "SSD test",
        description: "",
        price: 14900,
        stock: 3,
        category: "Test",
        active: true,
        createdAt: new Date(),
      });
      await carts.updateOne(
        { customerId: "cliente-2" },
        { $set: { items: [{ productId: productId.toString(), name: "SSD test", price: 14900, qty: 1 }], updatedAt: new Date() } },
        { upsert: true }
      );
      const { insertedId: orderId } = await orders.insertOne({
        customerId: "cliente-2",
        // qty 5 > stock 3: el descuento debe parar en 0, no en -2
        items: [{ productId: productId.toString(), name: "SSD test", price: 14900, qty: 5 }],
        total: 74500,
        status: "pending",
        stripeSessionId: "cs_test_123",
        createdAt: new Date(),
      });

      const first = await markOrderPaid(db!, { _id: orderId });
      const retry = await markOrderPaid(db!, { _id: orderId }); // reintento del webhook
      expect(first).toBe(true);
      expect(retry).toBe(false); // no repite efectos

      const product = await products.findOne({ _id: productId });
      expect(product!.stock).toBe(0); // descontado una sola vez, floor en 0

      const cart = await carts.findOne({ customerId: "cliente-2" });
      expect(cart!.items).toHaveLength(0); // carrito vaciado
    }
  );

  it.skipIf(!db)("stripeSessionId es único (RF-07/08)", async () => {
    const orders = db!.collection<OrderDoc>("orders");
    const base: OrderDoc = {
      customerId: "cliente-3",
      items: [],
      total: 500,
      status: "pending",
      stripeSessionId: "cs_test_unico",
      createdAt: new Date(),
    };
    await orders.insertOne({ ...base });
    await expect(orders.insertOne({ ...base, _id: undefined })).rejects.toSatisfy(
      (err) => err instanceof MongoServerError && err.code === 11000
    );
  });
});
