import Link from "next/link";
import { getSession } from "@/lib/auth";
import { brand } from "@/lib/brand";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const session = await getSession();

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800/80 sticky top-0 z-10 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg text-zinc-100 uppercase tracking-wide">
          <span className="text-amber-400">▲</span> {brand.name}
        </Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          Catálogo
        </Link>
        {session && (
          <>
            <Link href="/cart" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Carrito
            </Link>
            <Link href="/orders" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Mis pedidos
            </Link>
          </>
        )}
        {session?.role === "admin" && (
          <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            Admin
          </Link>
        )}
        <div className="ml-auto flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-zinc-500">Hola, {session.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-md font-semibold hover:bg-amber-300 transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
