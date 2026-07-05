import { brand } from "@/lib/brand";

export default function Footer() {
  const { address, email, phone, whatsapp, hours } = brand.contact;

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <p className="font-bold uppercase tracking-wide text-zinc-100">
            <span className="text-amber-400">▲</span> {brand.name}
          </p>
          <p className="text-sm text-zinc-500 mt-2 max-w-xs">{brand.tagline}</p>
        </div>

        <div className="text-sm">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Visítanos</p>
          <p className="text-zinc-300">{address}</p>
          <p className="text-zinc-500 mt-1">{hours}</p>
        </div>

        <div className="text-sm">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Contacto</p>
          <ul className="flex flex-col gap-2">
            <li>
              <a
                href={`mailto:${email}`}
                className="text-zinc-300 hover:text-amber-400 transition-colors"
              >
                ✉️ {email}
              </a>
            </li>
            <li>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-zinc-300 hover:text-amber-400 transition-colors">
                📞 {phone}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-green-400 transition-colors"
              >
                💬 WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800/50">
        <p className="max-w-7xl mx-auto px-6 py-4 text-xs text-zinc-600">
          © {new Date().getFullYear()} {brand.name} — pagos procesados por Stripe
        </p>
      </div>
    </footer>
  );
}
