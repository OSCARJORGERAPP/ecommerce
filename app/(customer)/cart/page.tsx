"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  total: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchCart = useCallback(async (): Promise<CartState> => {
    const res = await fetch("/api/cart");
    return res.json();
  }, []);

  // Regla react-hooks/set-state-in-effect: el fetch devuelve datos y el
  // setState va en el callback (ver AGENTS.md §Convenciones)
  useEffect(() => {
    fetchCart().then(setCart);
  }, [fetchCart]);

  async function setQty(productId: string, qty: number) {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty }),
    });
    const data = await res.json();
    if (res.ok) setCart(data);
    else setError(data.error);
  }

  async function remove(productId: string) {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setCart(await res.json());
  }

  async function checkout() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url; // → Stripe Checkout
    } else {
      setBusy(false);
      setError(data.error ?? "No se pudo iniciar el pago");
    }
  }

  if (!cart) return <p className="text-zinc-500">Cargando carrito…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Carrito</h1>
      {cart.items.length === 0 ? (
        <p className="text-zinc-500">
          Tu carrito está vacío.{" "}
          <Link href="/" className="underline">
            Ver catálogo
          </Link>
        </p>
      ) : (
        <>
          <ul className="divide-y divide-zinc-800 bg-zinc-900 rounded-xl border border-zinc-800">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-zinc-500">{formatCents(item.price)} / ud.</p>
                </div>
                <select
                  value={item.qty}
                  onChange={(e) => setQty(item.productId, Number(e.target.value))}
                  className="border border-zinc-700 rounded-md px-2 py-1 bg-zinc-950 text-zinc-100"
                  aria-label={`Cantidad de ${item.name}`}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="w-24 text-right font-medium">
                  {formatCents(item.price * item.qty)}
                </span>
                <button
                  onClick={() => remove(item.productId)}
                  className="text-sm text-red-400 hover:underline"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between mt-6">
            <span className="text-xl font-bold">Total: {formatCents(cart.total)}</span>
            <button
              onClick={checkout}
              disabled={busy}
              className="bg-amber-400 text-zinc-950 px-6 py-2.5 rounded-md font-semibold hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {busy ? "Redirigiendo…" : "Pagar con Stripe"}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </>
      )}
    </div>
  );
}
