"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty }),
    });
    setBusy(false);
    if (res.status === 401) {
      router.push(`/login?next=/products/${productId}`);
      return;
    }
    const data = await res.json();
    setMessage(res.ok ? "Añadido al carrito ✓" : data.error);
  }

  if (stock === 0) {
    return <p className="text-red-400 font-medium">Agotado</p>;
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="border border-zinc-700 rounded-md px-2 py-2 bg-zinc-900 text-zinc-100"
        aria-label="Cantidad"
      >
        {Array.from({ length: Math.min(stock, 10) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        onClick={add}
        disabled={busy}
        className="bg-amber-400 text-zinc-950 px-5 py-2 rounded-md font-semibold hover:bg-amber-300 disabled:opacity-50 transition-colors"
      >
        {busy ? "Añadiendo…" : "Añadir al carrito"}
      </button>
      {message && <span className="text-sm text-zinc-400">{message}</span>}
    </div>
  );
}
