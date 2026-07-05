# 🎬 Guion del video de entrega — 5:00 min

> Tres secuencias: **funcionamiento** (0:00–2:30), **código** (2:30–4:00) y
> **reflexión final** (4:00–5:00). Tiempos orientativos; ensayar con cronómetro.

## Preparación (antes de grabar)

```bash
# MongoDB: servicio nativo de Windows ya corriendo (no hace falta Docker)
npm run seed              # estado demo (si la BD está vacía)
npm run dev               # http://localhost:3000
# Opcional para enseñar el webhook en vivo:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Pestañas abiertas en este orden: ① http://localhost:3000 · ② VS Code ·
③ terminal · ④ GitLab (pipelines del repo).
Credenciales a mano: admin `admin@ecommerce.dev` / `admin123` · tarjeta `4242 4242 4242 4242`.
**Empezar deslogueado y con el carrito vacío.**

---

## SECUENCIA 1 — Funcionamiento (0:00 – 2:30)

### 0:00–0:15 · Presentación (pestaña ①, home con el hero)
> "Esta es una **tienda online completa**: catálogo, carrito persistente, pago real con **Stripe Checkout** confirmado por webhook, y panel de administración. El hero y los datos de contacto son **white-label**: se cambian por variables de entorno para cualquier empresa."

### 0:15–0:40 · Catálogo y detalle (RF-04/05)
- Señalar el hero "ELECTRONICS", bajar al catálogo, filtrar por una categoría (chips) y quitar el filtro.
- Entrar a un producto: imagen, precio, stock.
> "Los listados son **Server Components** que leen MongoDB directamente; el precio se almacena en **céntimos enteros** y solo se formatea al mostrar — cero errores de coma flotante."

### 0:40–1:00 · Registro y login (RF-01/02)
- **Registrarse** con un usuario nuevo → login.
- Abrir DevTools → Application → Cookies: señalar la cookie `session` con el candado **HttpOnly**.
> "Autenticación **artesanal**, sin librerías de terceros: contraseña con bcrypt y sesión JWT firmada con `jose` en cookie httpOnly — el JavaScript del navegador no puede leerla."

### 1:00–1:20 · Carrito persistente (RF-06)
- Añadir 2 unidades de un producto + otro producto; ir al carrito, cambiar una cantidad, quitar uno.
> "El carrito vive en MongoDB por cliente, no en el navegador: sobrevive a cerrar sesión y a cambiar de dispositivo."

### 1:20–1:55 · Pago con Stripe (RF-07/08)
- **Pagar con Stripe** → página de Checkout → tarjeta `4242 4242 4242 4242` → pagar.
- Vuelve a `/checkout/success` ("¡Pago completado!") → ir a **Mis pedidos**: estado **Pagado**.
> "El servidor crea una **Checkout Session** y un pedido pendiente; Stripe confirma el pago por **webhook con firma verificada**, y la página de éxito tiene una verificación de respaldo por si el webhook no llega en local. La operación es **idempotente**: los reintentos de Stripe no duplican nada."

### 1:55–2:30 · Panel de administración (RF-10/11/12/13)
- Salir → login `admin@ecommerce.dev` → **Admin**.
- **Dashboard**: productos, clientes, pedidos e ingresos (solo pagados).
- **Productos**: crear uno rápido (precio en euros → se guarda en céntimos), desactivarlo → mostrar que desaparece del catálogo.
- **Pedidos**: cambiar el pedido recién pagado a **Enviado**; señalar que un cancelado no ofrece transiciones.
> "Rutas protegidas por rol con **`proxy.ts`** — el sustituto de middleware en Next 16 — y cada API revalida el rol del JWT **en servidor**. Las transiciones de estado están validadas: no se puede saltar de enviado a pendiente."

---

## SECUENCIA 2 — Código (2:30 – 4:00)

### 2:30–2:50 · Definición y stack (VS Code: `README.md`)
- Mostrar el README con el diagrama.
> "**Qué es**: el ciclo completo de compra online — catálogo, carrito, pago, confirmación y gestión. **Stack**: Next.js 16 con App Router y TypeScript, Tailwind 4, **MongoDB con driver nativo** sin ORM, auth con `jose` y bcrypt, **Stripe Checkout + webhooks**. La especificación vive en `PROMPT.md` (el qué) y `AGENTS.md` (el cómo), con 14 requisitos funcionales."

### 2:50–3:15 · Arquitectura (README, diagrama Mermaid)
- Zoom al diagrama: navegador → proxy → Next → MongoDB / Stripe → webhook de vuelta.
> "El flujo de pago es la decisión central: el pedido nace **pendiente**, Stripe cobra, y el **webhook verifica la firma** antes de marcarlo pagado con un update condicionado — idempotente por diseño, con índice único sobre la sesión de Stripe. Dinero **siempre en céntimos enteros**, de la BD a Stripe, que usa la misma unidad."

### 3:15–3:40 · Estructura (VS Code: árbol + `proxy.ts` + `lib/`)
- Expandir `app/`: señalar los **route groups** `(public)`, `(customer)`, `(admin)`.
- Abrir `proxy.ts` 10 segundos: "10 líneas protegen las tres zonas por rol".
- Expandir `lib/`: db, jwt, auth, format, products, stripe.
> "Los route groups organizan los layouts por rol. La lógica testeable vive en **`lib/` como funciones puras** — dinero, transiciones de pedido, validación, JWT — y las API Routes solo validan, autorizan y persisten. Detalle heredado de proyectos anteriores: los clientes de Mongo y Stripe son **lazy** para que `next build` no falle en el runner de CI sin variables de entorno."

### 3:40–3:50 · Tests (terminal)
- Ejecutar `npm test` en vivo (~1 s).
> "**25 tests en verde**: unitarios — céntimos, transiciones de estado, JWT con tokens manipulados — e **integración real contra MongoDB**: índice único de email, carrito, idempotencia del webhook con descuento de stock. Cada requisito funcional tiene al menos un test."

### 3:50–4:00 · CI y white-label (navegador: GitLab · VS Code: `lib/brand.ts`)
- Mostrar el pipeline verde en GitLab.
> "Sincronizado en **GitHub y GitLab**; el pipeline construye la imagen con el **Dockerfile multi-stage standalone** en el runner de Cloud Run — **verde al primer intento**, con la configuración heredada de la retrospectiva de proyectos anteriores. Y la marca es **white-label**: nombre, lema y contacto por variables de entorno — la misma imagen sirve para varias empresas."

---

## SECUENCIA 3 — Reflexión final (4:00 – 5:00)

*(VS Code: `REFLEXION-FINAL.md` abierto; ir haciendo scroll por sección)*

### 4:00–4:20 · Decisiones que funcionaron (§Decisiones)
> "Cierro con lo más saliente de la reflexión final. Tres decisiones dieron el resultado esperado. **Céntimos como enteros** en todo el sistema: Stripe usa la misma unidad, así que no hay ni una sola conversión con decimales en el flujo de dinero. **Webhook más verificación de respaldo sobre la misma función idempotente** — `markOrderPaid` —: el pago se confirma aunque el webhook no llegue, y los reintentos no duplican efectos: el carrito se vacía y el stock se descuenta exactamente una vez. Y **auth artesanal como decisión didáctica consciente**: ver la sesión por dentro, asumiendo que en producción real usaría una solución auditada."

### 4:20–4:35 · Deuda técnica asumida (scroll a §Deuda técnica)
> "Deuda, dicha honestamente: el stock se descuenta **al pagar, sin reserva previa** — dos compradores simultáneos del último artículo podrían pagar ambos; lo correcto sería reservar al crear la sesión de checkout. Los **checkouts abandonados** dejan pedidos pendientes que hoy cancela el admin; deberían expirar con la sesión de Stripe. Y falta la **prueba de carga** de 50 concurrentes que fija la especificación."

### 4:35–4:50 · Aprendizajes (scroll a §Aprendizajes)
> "Tres aprendizajes. El principal es de **método**: documentar cada incidente como problema-causa-solución convierte los errores en infraestructura reutilizable — este proyecto arrancó con el CI ya resuelto desde bonos y videocapture, y salió verde a la primera. De **Next 16**: rompe lo aprendido — `proxy.ts` en vez de middleware, `params` asíncronos — y la documentación embarcada en `node_modules` es la fuente fiable. Y una trampa de infraestructura: **`localhost` eran dos servidores** — un Mongo nativo en IPv4 y otro en Docker en IPv6 sobre el mismo puerto; fijar `127.0.0.1` explícito eliminó la ambigüedad."

### 4:50–5:00 · Qué haría distinto · cierre (scroll a §Qué haría distinto)
> "¿Qué haría distinto? **Reserva de stock desde el día uno** — retrofitear inventario es más caro —, métricas y health check junto con la primera route, y convertir la verificación manual del flujo completo en un **test de Playwright**. En resumen: los 14 requisitos implementados, probados y documentados, con la especificación como contrato. Gracias."

---

## Chuleta de tiempos

| Marca | Escena |
|---|---|
| 0:00 | Presentación (hero white-label) |
| 0:15 | Catálogo + filtros + detalle |
| 0:40 | Registro/login + cookie httpOnly |
| 1:00 | Carrito persistente |
| 1:20 | Pago Stripe + Mis pedidos |
| 1:55 | Admin: dashboard, CRUD, pedidos |
| 2:30 | Definición y stack |
| 2:50 | Arquitectura + flujo de pago |
| 3:15 | Estructura: route groups, proxy, lib/ |
| 3:40 | Tests en vivo |
| 3:50 | CI verde + white-label |
| 4:00 | Reflexión: decisiones que funcionaron |
| 4:20 | Reflexión: deuda técnica |
| 4:35 | Reflexión: aprendizajes |
| 4:50 | Qué haría distinto · gracias |
n