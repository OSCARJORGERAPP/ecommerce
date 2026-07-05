# 🛒 Ecommerce — Next.js + MongoDB + Stripe — Especificación

> Este archivo es el **QUÉ** (contrato de especificación). El **CÓMO** operativo
> (instalación, comandos, convenciones, CI) vive en `AGENTS.md`.

## 1. Objetivo

Construir una **tienda online completa** con catálogo, carrito, pago real con Stripe
y panel de administración. Es el proyecto más completo del bloque: integra
autenticación, roles, pagos y webhooks.

Con este proyecto el alumno aprende:

- **Autenticación manual** con sesiones JWT (`jose`) en cookie `httpOnly` y
  contraseñas con `bcrypt` — sin librerías de auth de terceros.
- **Roles** (`admin` / `customer`) y protección de rutas con `proxy.ts`
  (el sustituto de `middleware.ts` en Next.js 16).
- Integración de **Stripe Checkout** y confirmación de pagos por **webhook**.
- **Route groups** de Next.js — `(public)`, `(customer)`, `(admin)` — para
  organizar layouts por rol.

## 2. Alcance

**Incluido (MVP)**
- Cliente: registro y login, catálogo de productos, detalle, carrito persistente
  en BD, pago con Stripe Checkout, historial de pedidos.
- Admin: dashboard con resumen, CRUD completo de productos, listado de clientes,
  gestión de pedidos con cambio de estado.
- Seed de datos (productos + usuario admin), tests automatizados y pipeline CI en verde.

**Fuera de alcance (por ahora)**
- Envíos/logística reales, devoluciones y reembolsos automáticos.
- Buscador avanzado, reseñas, cupones, multimoneda, multi-idioma.
- Despliegue automatizado desde CI (ver §9: el CI de la academia solo cubre el build).

## 3. Stack tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 | Stack del scaffold actual; route groups por rol |
| Base de datos | MongoDB (driver nativo, singleton en `lib/db.ts`) | Sin ORM: el alumno ve las queries reales |
| Auth | Cookie httpOnly + JWT (`jose`) + `bcryptjs` | Aprendizaje de auth artesanal, sin terceros |
| Pagos | Stripe Checkout Sessions + Webhooks | Pago real con flujo webhook estándar |
| Tests | Vitest (unitarios + integración) | Mismo runner que los proyectos hermanos |

> Dependencias del dominio instaladas: `mongodb`, `jose`, `bcryptjs`, `stripe`;
> dev: `vitest`, `tsx`.

## 4. Requisitos funcionales

Cada RF es verificable y debe tener ≥1 test automatizado (política en `AGENTS.md`).

| RF | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| RF-01 | Registro de cliente | `POST /api/auth/register` crea usuario con `passwordHash` (bcrypt) y rol `customer`; email duplicado → 409 |
| RF-02 | Login / logout con sesión JWT | Login correcto firma JWT (`jose`) en cookie `httpOnly`; el JS del navegador nunca puede leerla; logout la elimina |
| RF-03 | Roles y protección de rutas | `proxy.ts` redirige: `(admin)` solo `admin`, `(customer)` requiere sesión; API admin verifica rol en servidor |
| RF-04 | Catálogo público | Listado de productos `active` leído de MongoDB en Server Component |
| RF-05 | Detalle de producto | Página de detalle con precio formateado desde céntimos y stock |
| RF-06 | Carrito persistente | `GET/POST/DELETE /api/cart` persiste el carrito por `customerId` en la colección `carts`; sobrevive a logout/login |
| RF-07 | Checkout con Stripe | `POST /api/checkout` crea una Checkout Session desde el carrito y un pedido `pending` con `stripeSessionId` |
| RF-08 | Confirmación por webhook | `/api/stripe/webhook` verifica la firma y marca el pedido `paid`; la página de éxito verifica además vía `/api/checkout/verify` (en local el webhook puede no llegar) |
| RF-09 | Historial de pedidos | El cliente ve solo SUS pedidos con estado y total |
| RF-10 | Dashboard admin | Resumen: nº productos, pedidos, clientes e ingresos (céntimos sumados en servidor) |
| RF-11 | CRUD de productos (admin) | Crear/editar/activar-desactivar/borrar productos con validación |
| RF-12 | Listado de clientes (admin) | Tabla de usuarios rol `customer` |
| RF-13 | Gestión de pedidos (admin) | Cambio de estado `pending → paid → shipped / cancelled` |
| RF-14 | Seed de datos | `scripts/seed.ts` crea productos de ejemplo, el usuario admin e índices |

## 5. Requisitos no funcionales (medibles)

| Métrica | Objetivo |
|---|---|
| Latencia API p95 (rutas de catálogo/carrito) | < 300 ms en local |
| Tiempo de respuesta MongoDB p95 por operación clave | < 50 ms (con índices de §6) |
| Accesos concurrentes | ≥ 50 usuarios simultáneos sin degradación > 20% |
| Tamaño por documento | producto < 2 KB; pedido < 8 KB; carrito < 4 KB |
| Webhook Stripe | procesado idempotente en < 2 s; reintentos de Stripe no duplican pedidos |
| Build de producción | `next build` sin errores y sin depender de env vars en build-time |

## 6. Modelo de datos

**Dinero siempre en céntimos (enteros)** — se almacena y calcula en céntimos para
evitar errores de coma flotante; solo se formatea al mostrar.

| Colección | Campos clave | Índices previstos |
|---|---|---|
| `users` | `email`, `passwordHash`, `role` (`admin`\|`customer`), `name` | `email` único |
| `products` | `name`, `description`, `price` (céntimos), `stock`, `category`, `active` | `active+category` |
| `orders` | `customerId`, `items[]`, `total`, `status` (`pending`\|`paid`\|`shipped`\|`cancelled`), `stripeSessionId` | `customerId`, `stripeSessionId` único |
| `carts` | `customerId`, `items[]`, `updatedAt` | `customerId` único |

## 7. Entregables documentales (OBLIGATORIOS)

| Entregable | Propósito | Estado |
|---|---|---|
| `README.md` | Visión general, instalación, arranque, arquitectura resumida | ✅ |
| `QUICKSTART.md` | De cero a corriendo en < 5 min | ✅ |
| `RETROSPECTIVA.md` | Bitácora problema → causa → solución | ✅ (con lecciones CI heredadas) |
| `REFLEXION-FINAL.md` | Cierre: logros, decisiones, deuda técnica | 🟡 stub |
| Tests automatizados | ≥1 por RF; unitarios + integración | ✅ (25 tests) |
| Seed de datos | `scripts/seed.ts` (RF-14) | ✅ |
| `.env.example` | Plantilla de variables de entorno | ✅ |
| Lockfile | `package-lock.json` commiteado | ✅ |
| Pipeline CI | `.gitlab-ci.yml` (templates academia; ver AGENTS.md §CI) | ✅ |
| Diagrama de arquitectura | Mermaid en README | 🟡 stub |
| Sección de métricas | §5/§8 + cómo medirlas (AGENTS.md) | 🟡 |
| Guía de deployment | AGENTS.md §Deployment | 🟡 |

## 8. Métricas y observabilidad

- **Latencias p50/p95/p99** de `/api/products`, `/api/cart`, `/api/checkout`
  (medidas con `autocannon` o equivalente; ver AGENTS.md §Métricas).
- **Tiempos de MongoDB** por operación clave con `explain("executionStats")`
  verificando el uso de los índices de §6.
- **Concurrencia**: prueba de carga con ≥ 50 conexiones y registro del punto de degradación.
- **Webhooks**: tasa de éxito y latencia de procesado en logs del servidor.
- Umbrales objetivo: los de §5.

## 9. Deployment público

- **Entorno objetivo**: contenedor único Next.js standalone (Dockerfile multi-stage),
  MongoDB gestionado. Plataforma concreta: `TODO` (candidato: Cloud Run, como bonos).
- **CI (gitlab.codecrypto.academy)**: se exige **pipeline en verde limpio** cubriendo
  el job `build` de los templates de la academia. El despliegue automatizado queda
  explícitamente **fuera de alcance** (los jobs de provisión/deploy se saltan con
  `rules: when: never`; la infraestructura no los soporta — ver RETROSPECTIVA §CI).
- **Secretos**: `MONGODB_URI`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — nunca commiteados;
  plantilla en `.env.example`. El código acepta también las variables de plataforma
  (`MONGO_HOST`/`MONGO_PORT`/`MONGO_USER`/`MONGO_PASSWORD`/`MONGO_DB`).
- **Rollback**: `git revert` + redeploy; comandos en AGENTS.md.

## 10. Criterios de aceptación del proyecto

- [ ] Todos los RF de §4 implementados y con ≥1 test cada uno.
- [ ] Suite de tests al 100% en verde.
- [ ] `npm run lint` y `npm run build` sin errores.
- [ ] Pipeline CI de GitLab **en verde limpio** (no "passed with warnings").
- [ ] Todos los entregables de §7 completos (sin stubs pendientes).
- [ ] Flujo de pago probado end-to-end con tarjeta de prueba `4242 4242 4242 4242`
  y webhook local (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).
- [ ] Código subido y sincronizado en GitHub Y GitLab.
