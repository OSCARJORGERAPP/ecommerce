import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { formatCents } from "@/lib/format";
import type { OrderDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // El proxy ya filtra por rol; verificación adicional en servidor (RF-03)
  if (!(await getAdminSession())) return null;

  const db = await getDb();
  const [products, customers, orders, revenue] = await Promise.all([
    db.collection("products").countDocuments(),
    db.collection("users").countDocuments({ role: "customer" }),
    db.collection("orders").countDocuments(),
    db
      .collection<OrderDoc>("orders")
      .aggregate<{ total: number }>([
        { $match: { status: { $in: ["paid", "shipped"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ])
      .toArray()
      .then((r) => r[0]?.total ?? 0),
  ]);

  const stats = [
    { label: "Productos", value: String(products) },
    { label: "Clientes", value: String(customers) },
    { label: "Pedidos", value: String(orders) },
    { label: "Ingresos (pagados)", value: formatCents(revenue) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <p className="text-sm text-zinc-500">{s.label}</p>
          <p className="text-3xl font-bold mt-1">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
