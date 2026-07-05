import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4 mb-6">
        <h1 className="text-xl font-bold mr-4">Panel de administración</h1>
        <Link href="/admin" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          Dashboard
        </Link>
        <Link href="/admin/products" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          Productos
        </Link>
        <Link href="/admin/customers" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          Clientes
        </Link>
        <Link href="/admin/orders" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          Pedidos
        </Link>
      </div>
      {children}
    </>
  );
}
