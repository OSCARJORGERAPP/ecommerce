import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/lib/db";
import { formatCents } from "@/lib/format";
import type { ProductDoc } from "@/lib/types";
import Hero from "@/app/components/Hero";

// Lee MongoDB en cada request: sin esto, next build intentaría prerender la
// página conectando a la BD (que no existe en el runner de CI).
export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: PageProps<"/">) {
  const { cat } = await searchParams;
  const category = typeof cat === "string" ? cat : undefined;

  const db = await getDb();
  const collection = db.collection<ProductDoc>("products");
  const [products, categories] = await Promise.all([
    collection
      .find({ active: true, ...(category ? { category } : {}) })
      .sort({ createdAt: -1 })
      .toArray(),
    collection.distinct("category", { active: true }),
  ]);

  return (
    <>
      <Hero />

      {/* Filtro por categoría */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Link
          href="/"
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
            !category
              ? "border-amber-400 bg-amber-400/10 text-amber-400"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          }`}
        >
          Todo
        </Link>
        {categories.sort().map((c) => (
          <Link
            key={c}
            href={`/?cat=${encodeURIComponent(c)}`}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              category === c
                ? "border-amber-400 bg-amber-400/10 text-amber-400"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-zinc-500">
          {category
            ? `No hay productos en "${category}".`
            : "No hay productos todavía. Ejecuta el seed: "}
          {!category && <code>npm run seed</code>}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link
              key={p._id!.toString()}
              href={`/products/${p._id}`}
              className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-400/5 transition-all flex flex-col"
            >
              <div className="aspect-video bg-zinc-800 overflow-hidden">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-5xl font-bold text-zinc-600">
                    {p.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col gap-2 flex-1">
                <span className="text-xs uppercase tracking-widest text-amber-400/80">
                  {p.category}
                </span>
                <h2 className="font-semibold text-zinc-100">{p.name}</h2>
                <p className="text-sm text-zinc-500 line-clamp-2">{p.description}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-lg font-bold font-mono text-zinc-100">
                    {formatCents(p.price)}
                  </span>
                  {p.stock === 0 && (
                    <span className="text-xs text-red-400 border border-red-400/30 rounded-full px-2 py-0.5">
                      Agotado
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
