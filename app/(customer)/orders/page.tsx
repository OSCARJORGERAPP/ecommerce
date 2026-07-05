import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatCents, STATUS_LABELS } from "@/lib/format";
import type { OrderDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-400/10 text-amber-400",
  paid: "bg-green-400/10 text-green-400",
  shipped: "bg-blue-400/10 text-blue-400",
  cancelled: "bg-zinc-800 text-zinc-400",
};

export default async function OrdersPage() {
  const session = await getSession();
  // El proxy ya redirige sin sesión; esto es el cinturón del servidor
  if (!session) return null;

  const db = await getDb();
  const orders = await db
    .collection<OrderDoc>("orders")
    .find({ customerId: session.userId })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Mis pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-zinc-500">Todavía no has hecho ningún pedido.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li
              key={order._id!.toString()}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  {order.createdAt.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <ul className="mt-3 text-sm text-zinc-400">
                {order.items.map((item) => (
                  <li key={item.productId}>
                    {item.qty} × {item.name} — {formatCents(item.price * item.qty)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-bold">{formatCents(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
