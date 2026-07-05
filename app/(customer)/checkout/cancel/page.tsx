import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="max-w-md mx-auto text-center mt-12">
      <p className="text-5xl mb-4">❌</p>
      <h1 className="text-2xl font-bold">Pago cancelado</h1>
      <p className="text-zinc-400 mt-2">
        No se ha realizado ningún cargo. Tu carrito sigue intacto.
      </p>
      <Link href="/cart" className="inline-block mt-6 underline">
        Volver al carrito
      </Link>
    </div>
  );
}
