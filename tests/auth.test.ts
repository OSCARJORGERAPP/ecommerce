// Tests de la auth artesanal (RF-01/02/03): bcrypt + JWT con jose.
import { beforeAll, describe, expect, it } from "vitest";
import {
  hashPassword,
  signSession,
  verifyPassword,
  verifySession,
} from "@/lib/jwt";
import type { Session } from "@/lib/types";

beforeAll(() => {
  process.env.AUTH_SECRET = "secreto-de-test-suficientemente-largo";
});

const session: Session = {
  userId: "64b1f0c2a1b2c3d4e5f60718",
  email: "cliente@test.dev",
  name: "Cliente",
  role: "customer",
};

describe("contraseñas (bcrypt)", () => {
  it("hash y verificación correcta", async () => {
    const hash = await hashPassword("secreta123");
    expect(hash).not.toBe("secreta123");
    expect(await verifyPassword("secreta123", hash)).toBe(true);
  });

  it("rechaza contraseña incorrecta", async () => {
    const hash = await hashPassword("secreta123");
    expect(await verifyPassword("otra", hash)).toBe(false);
  });
});

describe("sesión JWT (jose)", () => {
  it("firma y verifica el roundtrip completo", async () => {
    const token = await signSession(session);
    const decoded = await verifySession(token);
    expect(decoded).toEqual(session);
  });

  it("preserva el rol admin (RF-03)", async () => {
    const token = await signSession({ ...session, role: "admin" });
    expect((await verifySession(token))?.role).toBe("admin");
  });

  it("rechaza un token manipulado", async () => {
    const token = await signSession(session);
    const [h, p, s] = token.split(".");
    // Payload alterado (p. ej. intentando escalar de rol) → firma inválida
    const tampered = `${h}.${p.slice(0, -2)}Xx.${s}`;
    expect(await verifySession(tampered)).toBeNull();
  });

  it("rechaza un token firmado con otro secreto", async () => {
    const token = await signSession(session);
    process.env.AUTH_SECRET = "otro-secreto-distinto-al-de-la-firma";
    expect(await verifySession(token)).toBeNull();
    process.env.AUTH_SECRET = "secreto-de-test-suficientemente-largo";
  });

  it("rechaza basura", async () => {
    expect(await verifySession("no-es-un-jwt")).toBeNull();
  });
});
