import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import type { UserDoc } from "@/lib/types";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  const db = await getDb();
  const customers = await db
    .collection<UserDoc>("users")
    .find({ role: "customer" }, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(customers.map((c) => ({ ...c, _id: c._id!.toString() })));
}
