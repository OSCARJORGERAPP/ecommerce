"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      router.push("/login");
    } else {
      setBusy(false);
      setError((await res.json()).error);
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-zinc-900 rounded-xl border border-zinc-800 p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6">Crear cuenta</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 rounded-md px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 rounded-md px-3 py-2"
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 rounded-md px-3 py-2"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="bg-amber-400 text-zinc-950 py-2 rounded-md font-semibold hover:bg-amber-300 disabled:opacity-50 transition-colors"
        >
          {busy ? "Creando…" : "Registrarse"}
        </button>
      </form>
      <p className="text-sm text-zinc-500 mt-4">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="underline">
          Entra
        </Link>
      </p>
    </div>
  );
}
