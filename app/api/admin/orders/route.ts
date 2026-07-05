import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import type { OrderDoc } from "@/lib/types";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  const db = await getDb();
  const orders = await db
    .collection<OrderDoc>("orders")
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(orders.map((o) => ({ ...o, _id: o._id!.toString() })));
}
