import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import type { UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  if (!(await getAdminSession())) return null;

  const db = await getDb();
  const customers = await db
    .collection<UserDoc>("users")
    .find({ role: "customer" }, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-zinc-500 border-b border-zinc-800">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Alta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {customers.map((c) => (
            <tr key={c._id!.toString()}>
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3">{c.email}</td>
              <td className="px-4 py-3 text-zinc-500">
                {c.createdAt.toLocaleDateString("es-ES")}
              </td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                Sin clientes todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
