"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatCents } from "@/lib/format";

interface VerifyResult {
  status?: string;
  total?: number;
  error?: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [result, setResult] = useState<VerifyResult | null>(null);

  const verify = useCallback(async (): Promise<VerifyResult> => {
    if (!sessionId) return { error: "Falta session_id" };
    const res = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`);
    return res.json();
  }, [sessionId]);

  useEffect(() => {
    verify().then(setResult);
  }, [verify]);

  if (!result) return <p className="text-zinc-500">Verificando el pago…</p>;

  return (
    <div className="max-w-md mx-auto text-center mt-12">
      {result.status === "paid" ? (
        <>
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-2xl font-bold">¡Pago completado!</h1>
          <p className="text-zinc-400 mt-2">
            Tu pedido de {formatCents(result.total ?? 0)} está confirmado.
          </p>
        </>
      ) : (
        <>
          <p className="text-5xl mb-4">⏳</p>
          <h1 className="text-2xl font-bold">Pago en proceso</h1>
          <p className="text-zinc-400 mt-2">{result.error ?? `Estado actual: ${result.status}`}</p>
        </>
      )}
      <Link href="/orders" className="inline-block mt-6 underline">
        Ver mis pedidos
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
