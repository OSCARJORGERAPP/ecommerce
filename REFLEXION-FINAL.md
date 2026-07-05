# 🎓 REFLEXIÓN FINAL — Ecommerce

> Cierre del proyecto (2026-07-05). Especificación en `PROMPT.md`; incidentes
> detallados en `RETROSPECTIVA.md`.

## Qué se logró

- **Los 14 requisitos funcionales de `PROMPT.md` §4, implementados y con test**:
  auth artesanal completa (bcrypt + JWT `jose` en cookie httpOnly), roles con
  `proxy.ts`, catálogo con filtros por categoría, carrito persistente en BD,
  pago real con **Stripe Checkout** confirmado por webhook con firma verificada
  (más verificación de respaldo), historial de pedidos, y panel admin con
  dashboard, CRUD de productos, clientes y gestión de pedidos con transiciones
  validadas.
- **25 tests Vitest en verde** (unitarios + integración real contra MongoDB),
  lint y build limpios.
- **Pipeline CI de GitLab verde al primer intento**, gracias a las lecciones
  heredadas de bonos/videocapture registradas ANTES de escribir código.
- **Flujo de pago probado end-to-end con Stripe real** (modo test): compra,
  cobro con tarjeta de prueba, confirmación y cambio de estado por el admin.
- Extras no exigidos por la especificación: tema oscuro con **marca white-label**
  (nombre, lema, domicilio y contacto por variables de entorno — la misma imagen
  Docker sirve para varias empresas), imágenes SVG de producto generadas
  localmente, y **descuento de stock idempotente** al confirmar el pago.

## Decisiones de diseño y sus trade-offs

1. **Céntimos como enteros en todo el sistema.** Stripe usa la misma unidad
   (`unit_amount`), así que no existe ni una sola conversión con decimales en el
   flujo de dinero. A cambio, la UI debe convertir euros↔céntimos en los
   formularios del admin — un único punto de conversión, explícito y testeado.
2. **Webhook + verificación de respaldo, ambos sobre `markOrderPaid()`.** El
   pago se confirma aunque el webhook no llegue (típico en local), y como ambos
   caminos comparten la misma transición idempotente (`pending → paid` con
   filtro condicionado), los reintentos de Stripe no duplican efectos: el
   carrito se vacía y el stock se descuenta exactamente una vez. Trade-off: dos
   caminos que mantener en vez de uno, mitigado centralizando en `lib/orders.ts`.
3. **Auth artesanal en vez de librería.** Objetivo didáctico del proyecto: ver
   la sesión por dentro (firmar, guardar en cookie httpOnly, verificar en
   `proxy.ts` y revalidar el rol en cada handler). Trade-off consciente: sin
   refresh tokens, ni revocación, ni rate limiting — en producción real usaría
   una solución auditada.
4. **`proxy.ts` protege por rol, pero cada API revalida en servidor.** El proxy
   es UX (redirecciones); la seguridad real está en `getSession()` /
   `getAdminSession()` dentro de cada route handler. Nunca se confía en el cliente.
5. **Clientes lazy (Mongo, Stripe) y páginas `force-dynamic`.** Ninguna
   validación de entorno ocurre al importar módulos, y ninguna página toca la BD
   en build: `next build` funciona en un runner de CI sin servicios — requisito
   directo de las lecciones de CI heredadas.

## Deuda técnica pendiente

- **El stock se descuenta al pagar, sin reserva previa**: dos compradores
  simultáneos del último artículo podrían completar ambos el pago. Lo correcto
  sería reservar stock al crear la Checkout Session y liberarlo si expira.
- **Los checkouts abandonados dejan pedidos `pending`** hasta que el admin los
  cancela; deberían expirar automáticamente con la sesión de Stripe (webhook
  `checkout.session.expired`).
- **Falta la prueba de carga** de los 50 usuarios concurrentes que fija
  `PROMPT.md` §5, y la instrumentación de latencias (p50/p95) sigue siendo
  manual con `autocannon`.
- El **webhook secret local** sigue en placeholder: el flujo se validó con la
  verificación de respaldo; probar `stripe listen` end-to-end queda pendiente.

## Aprendizajes

- **El más valioso es de método, no de código**: documentar cada incidente como
  *problema → causa → solución* convierte los errores en infraestructura
  reutilizable. Este proyecto arrancó con la sección de CI ya resuelta desde
  bonos/videocapture y el pipeline salió verde a la primera — el tiempo que en
  proyectos anteriores se perdió depurando runners aquí se invirtió en features.
- **Next 16 rompe lo aprendido** y la documentación embarcada en
  `node_modules/next/dist/docs` es la fuente fiable: `proxy.ts` en vez de
  middleware, `params`/`searchParams` asíncronos, `RouteContext`/`PageProps`
  tipados. Leerla antes de escribir código evitó todos los choques.
- **`localhost` no es un lugar, son dos**: con un mongod nativo (IPv4) y otro en
  Docker (IPv6) escuchando el mismo puerto, cada cliente puede resolver a uno
  distinto. Fijar `127.0.0.1` explícito en `.env`, seed y tests eliminó la
  ambigüedad. Del mismo modo, `tsx` no carga `.env.local`: los scripts deben
  tener fallbacks correctos.
- **La idempotencia se diseña, no se parchea**: modelar la confirmación de pago
  como una única transición condicionada (`findOneAndUpdate` con
  `status: "pending"`) hizo trivial que webhook, verify y reintentos convivan.
  El test de integración que lo demuestra (pagar dos veces, descontar una) es
  el más valioso de la suite.
- Detalles pequeños que costaron tiempo real: `it.skipIf` de Vitest recibe un
  booleano (no una función) y se evalúa antes de `beforeAll`; y `es-ES` no
  agrupa los miles en números de 4 dígitos (CLDR `minimumGroupingDigits: 2`) —
  el test de formato estaba mal, no el código.

## Qué haría distinto

- **Reserva de stock desde el día uno**: retrofitear inventario transaccional
  sobre un flujo de pago ya construido es más caro que diseñarlo al principio.
- Un **endpoint `/health`** y logging estructurado de latencias junto con la
  primera route, no al final — las métricas de §5 seguirían midiéndose solas.
- Convertir la verificación manual end-to-end (registro → carrito → pago →
  admin) en un **test de regresión automatizado** (Playwright) en vez de
  repetirla con curl en cada cambio grande.
