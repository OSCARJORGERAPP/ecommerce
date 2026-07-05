// Helpers de sesión ligados a la request (leen la cookie httpOnly).
// La criptografía pura (jose/bcrypt) vive en lib/jwt.ts.
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./jwt";
import type { Session } from "./types";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Sesión de admin o null — toda ruta admin verifica el rol EN SERVIDOR. */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getSession();
  return session?.role === "admin" ? session : null;
}
