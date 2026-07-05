import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifyPassword } from "@/lib/jwt";
import type { UserDoc } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { email, password } = body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db
    .collection<UserDoc>("users")
    .findOne({ email: email.toLowerCase().trim() });

  // Mismo error para usuario inexistente y contraseña incorrecta
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = await signSession({
    userId: user._id!.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({ name: user.name, role: user.role });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
