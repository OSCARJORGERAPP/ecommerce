import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { validateProduct } from "@/lib/products";
import type { ProductDoc } from "@/lib/types";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  const db = await getDb();
  const products = await db
    .collection<ProductDoc>("products")
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(products.map((p) => ({ ...p, _id: p._id!.toString() })));
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  const data = validateProduct(await request.json().catch(() => null));
  if (!data) {
    return NextResponse.json(
      { error: "name, description, price (céntimos, entero ≥ 0), stock (entero ≥ 0) y category son obligatorios" },
      { status: 400 }
    );
  }
  const db = await getDb();
  const { insertedId } = await db
    .collection<ProductDoc>("products")
    .insertOne({ ...data, createdAt: new Date() });
  return NextResponse.json({ _id: insertedId.toString() }, { status: 201 });
}
