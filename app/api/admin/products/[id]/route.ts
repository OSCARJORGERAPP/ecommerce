import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { validateProduct } from "@/lib/products";
import type { ProductDoc } from "@/lib/types";

export async function PUT(request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Id inválido" }, { status: 400 });

  const data = validateProduct(await request.json().catch(() => null));
  if (!data) return NextResponse.json({ error: "Datos de producto inválidos" }, { status: 400 });

  const db = await getDb();
  const result = await db
    .collection<ProductDoc>("products")
    .updateOne({ _id: new ObjectId(id) }, { $set: data });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Id inválido" }, { status: 400 });

  const db = await getDb();
  const result = await db
    .collection<ProductDoc>("products")
    .deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
