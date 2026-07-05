import { notFound } from "next/navigation";
import Image from "next/image";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { formatCents } from "@/lib/format";
import type { ProductDoc } from "@/lib/types";
import AddToCart from "./AddToCart";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const db = await getDb();
  const product = await db
    .collection<ProductDoc>("products")
    .findOne({ _id: new ObjectId(id), active: true });
  if (!product) notFound();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl">
      <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={800}
            height={450}
            className="w-full h-auto object-cover"
            priority
          />
        ) : (
          <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-7xl font-bold text-zinc-600">
            {product.name.charAt(0)}
          </div>
        )}
      </div>
      <div>
        <span className="text-xs uppercase tracking-widest text-amber-400/80">
          {product.category}
        </span>
        <h1 className="text-3xl font-bold mt-1 text-zinc-100">{product.name}</h1>
        <p className="text-3xl font-bold font-mono mt-4 text-zinc-100">
          {formatCents(product.price)}
        </p>
        <p className="text-zinc-400 mt-4 whitespace-pre-line">{product.description}</p>
        <p className="text-sm text-zinc-500 mt-2 font-mono">Stock: {product.stock}</p>
        <div className="mt-6">
          <AddToCart productId={product._id!.toString()} stock={product.stock} />
        </div>
      </div>
    </div>
  );
}
