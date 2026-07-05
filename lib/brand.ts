// Marca white-label: cada despliegue la personaliza por variables de entorno
// sin tocar código (se leen en runtime en Server Components).
export const brand = {
  name: process.env.BRAND_NAME ?? "Electronics",
  tagline: process.env.BRAND_TAGLINE ?? "Equipo seleccionado para tu setup",
  description:
    process.env.BRAND_DESCRIPTION ??
    "Periféricos, audio y componentes elegidos a mano. Envío rápido, pago seguro con Stripe.",
  contact: {
    address: process.env.BRAND_ADDRESS ?? "Av. Siempreviva 742, Springfield",
    email: process.env.BRAND_EMAIL ?? "hola@electronics.dev",
    phone: process.env.BRAND_PHONE ?? "+34 600 000 000",
    // Solo dígitos con prefijo de país, para el enlace wa.me
    whatsapp: process.env.BRAND_WHATSAPP ?? "34600000000",
    hours: process.env.BRAND_HOURS ?? "Lun–Vie 9:00–18:00",
  },
};
