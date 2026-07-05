import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cartTotal } from "@/lib/format";
import type { CartDoc, CartItem, ProductDoc } from "@/lib/types";

async function readCart(customerId: string): Promise<CartItem[]> {
  const db = await getDb();
  const cart = await db.collection<CartDoc>("carts").findOne({ customerId });
  return cart?.items ?? [];
}

async function writeCart(customerId: string, items: CartItem[]) {
  const db = await getDb();
  await db
    .collection<CartDoc>("carts")
    .updateOne(
      { customerId },
      { $set: { items, updatedAt: new Date() } },
      { upsert: true }
    );
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const items = await readCart(session.userId);
  return NextResponse.json({ items, total: cartTotal(items) });
}

/** Añade o fija cantidad: { productId, qty } (qty absoluta; 0 elimina). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { productId, qty } = body ?? {};
  if (
    typeof productId !== "string" || !ObjectId.isValid(productId) ||
    typeof qty !== "number" || !Number.isInteger(qty) || qty < 0
  ) {
    return NextResponse.json({ error: "productId y qty (entero ≥ 0) son obligatorios" }, { status: 400 });
  }

  const db = await getDb();
  const product = await db
    .collection<ProductDoc>("products")
    .findOne({ _id: new ObjectId(productId), active: true });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  if (qty > product.stock) {
    return NextResponse.json({ error: `Solo quedan ${product.stock} unidades` }, { status: 400 });
  }

  const items = (await readCart(session.userId)).filter((i) => i.productId !== productId);
  if (qty > 0) {
    items.push({ productId, name: product.name, price: product.price, qty });
  }
  await writeCart(session.userId, items);
  return NextResponse.json({ items, total: cartTotal(items) });
}

/** Elimina un producto ({ productId }) o vacía el carrito (sin body). */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const productId = body?.productId;
  const items = productId
    ? (await readCart(session.userId)).filter((i) => i.productId !== productId)
    : [];
  await writeCart(session.userId, items);
  return NextResponse.json({ items, total: cartTotal(items) });
}
