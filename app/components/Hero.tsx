import { brand } from "@/lib/brand";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-14 sm:px-12 sm:py-20 mb-10">
      {/* Resplandores ambientales */}
      <div className="absolute -top-32 -right-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-24 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl" />
      {/* Nombre fantasma de fondo, solo contorno */}
      <span
        aria-hidden
        className="absolute inset-x-0 -bottom-4 text-center text-[22vw] sm:text-[11rem] font-black uppercase leading-none tracking-tighter text-transparent select-none pointer-events-none"
        style={{ WebkitTextStroke: "1px rgba(255,255,255,0.05)" }}
      >
        {brand.name}
      </span>

      <div className="relative">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-400 mb-4">
          {brand.tagline}
        </p>
        <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight leading-none">
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            {brand.name}
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-zinc-400">{brand.description}</p>
      </div>
    </section>
  );
}
