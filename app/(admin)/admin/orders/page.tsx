"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCents, ORDER_TRANSITIONS, STATUS_LABELS } from "@/lib/format";
import type { CartItem, OrderStatus } from "@/lib/types";

interface Order {
  _id: string;
  customerId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    const res = await fetch("/api/admin/orders");
    return res.json();
  }, []);

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, [fetchOrders]);

  async function setStatus(id: string, status: OrderStatus) {
    setError(null);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setError((await res.json()).error);
    fetchOrders().then(setOrders);
  }

  if (!orders) return <p className="text-zinc-500">Cargando pedidos…</p>;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {orders.length === 0 && <p className="text-zinc-500">Sin pedidos todavía.</p>}
      {orders.map((order) => {
        const nextStatuses = ORDER_TRANSITIONS[order.status];
        return (
          <div key={order._id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-mono text-xs text-zinc-400">{order._id}</span>
              <span className="text-sm text-zinc-500">
                {new Date(order.createdAt).toLocaleString("es-ES")}
              </span>
              <span className="font-bold">{formatCents(order.total)}</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm font-medium">{STATUS_LABELS[order.status]}</span>
                {nextStatuses.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => setStatus(order._id, e.target.value as OrderStatus)}
                    className="border border-zinc-700 rounded-md px-2 py-1 text-sm bg-zinc-950 text-zinc-100"
                    aria-label="Cambiar estado"
                  >
                    <option value="" disabled>
                      Cambiar a…
                    </option>
                    {nextStatuses.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <ul className="mt-3 text-sm text-zinc-400">
              {order.items.map((item) => (
                <li key={item.productId}>
                  {item.qty} × {item.name} — {formatCents(item.price * item.qty)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
