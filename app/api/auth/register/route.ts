import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/jwt";
import type { UserDoc } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { name, email, password } = body ?? {};
  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) ||
    typeof password !== "string" || password.length < 6
  ) {
    return NextResponse.json(
      { error: "Nombre, email válido y contraseña (mín. 6 caracteres) son obligatorios" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const user: UserDoc = {
    email: email.toLowerCase().trim(),
    passwordHash: await hashPassword(password),
    role: "customer",
    name: name.trim(),
    createdAt: new Date(),
  };

  try {
    await db.collection<UserDoc>("users").insertOne(user);
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
