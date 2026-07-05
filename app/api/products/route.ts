import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { ProductDoc } from "@/lib/types";

/** Catálogo público: solo productos activos. */
export async function GET() {
  const db = await getDb();
  const products = await db
    .collection<ProductDoc>("products")
    .find({ active: true })
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(
    products.map((p) => ({ ...p, _id: p._id!.toString() }))
  );
}
