<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Guía operativa de Ecommerce

> Especificación del producto (el **QUÉ**, requisitos RF-01…RF-14 y métricas): ver
> `PROMPT.md`. Este archivo es el **CÓMO**.

## 🚀 Instalación (paso a paso)

```bash
# 1. Dependencias (usa el lockfile commiteado; en CI: npm ci)
npm install

# 2. Dependencias del dominio (aún no instaladas en el scaffold)
npm install mongodb jose bcryptjs stripe
npm install -D vitest tsx @types/bcryptjs

# 3. Variables de entorno
cp .env.example .env.local   # y rellenar valores (claves de test de Stripe)
```

## 🗄️ Servicios locales (Docker)

```bash
# MongoDB (si docker falla con "npipe:...", arrancar Docker Desktop primero)
docker run -d --name ecommerce-mongo -p 27017:27017 mongo:7
```

Seed de datos (productos de ejemplo + usuario admin + índices):

```bash
npx tsx scripts/seed.ts
```

Webhooks de Stripe en local:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Tarjeta de prueba: 4242 4242 4242 4242
```

## ▶️ Arranque del sistema

```bash
npm run dev                  # desarrollo → http://localhost:3000
npm run build && npm start   # producción (build standalone, ver §CI)
npm run lint                 # ESLint
```

## ✅ Tests

Vitest (tests en `tests/`):

```bash
npm test                 # suite completa (unitarios + integración)
npm run test:watch       # desarrollo
npm run test:cov         # cobertura
```

Los tests de integración usan el MongoDB local y **se saltan limpiamente** si no
está disponible (p. ej. en el runner de CI). Ojo: `it.skipIf` recibe un **booleano**,
no una función, y se evalúa antes de `beforeAll` → conectar en la carga del módulo
con `serverSelectionTimeoutMS` corto (ver RETROSPECTIVA §lecciones heredadas).

Política: **cada RF de `PROMPT.md` §4 tiene ≥1 test**; los cálculos de dinero
(céntimos, totales) llevan tests unitarios exhaustivos. PR sin tests no se mergea.

## 🧱 Estructura del proyecto

```
app/
  (public)/          # catálogo, detalle de producto, login, registro
  (customer)/        # carrito, checkout success/cancel, historial de pedidos
  (admin)/admin/     # dashboard, CRUD de productos, clientes, pedidos
  api/               # auth, cart, checkout, stripe/webhook, admin/...
lib/
  db.ts              # MongoClient singleton (lazy — ver §CI y convención "clientes lazy")
  auth.ts            # JWT (jose), hash de contraseñas (bcryptjs), sesión
  types.ts           # Interfaces TypeScript del dominio
scripts/seed.ts      # Datos iniciales (incluye el usuario admin)
proxy.ts             # Next 16 (ex-middleware): protege rutas por rol leyendo el JWT
tests/               # Vitest: auth, precios, carrito, integración
Dockerfile           # multi-stage standalone (requerido por el CI de la academia)
```

La lógica de negocio testeable vive en `lib/` (pura, sin Next); las route handlers
son finas: validan, autorizan y persisten.

## 🧭 Convenciones

- **Dinero**: importes siempre en **céntimos** (enteros). Nunca `float` para dinero;
  formatear solo en la capa de presentación.
- **Roles en servidor**: toda ruta admin verifica el rol del JWT en servidor (nunca
  confiar en el cliente); el cliente solo accede a sus propios datos.
- **Acceso a datos**: siempre a través del singleton `lib/db.ts`; sin conexiones ad-hoc.
- **Clientes lazy**: no crear clientes (Mongo, Stripe) ni validar env vars en el
  top-level del módulo — `next build` evalúa los módulos y el `throw` salta en
  build-time (el runner de CI no tiene esas variables). Usar `getDb()`, `getStripe()`.
- **Server vs Client Components**: listados leen MongoDB directamente en el servidor;
  las páginas interactivas (carrito, formularios) son Client Components que llaman a la API.
- **React hooks (ESLint 9 + Next 16)**: la regla `react-hooks/set-state-in-effect`
  prohíbe llamar desde el cuerpo de `useEffect` funciones que hacen `setState`
  (aunque sea tras `await`). Patrón: `useEffect(() => { fetchAll().then(apply); }, [fetchAll])`;
  en event handlers sí está permitido.
- **TypeScript estricto**; tipos del dominio compartidos entre API y UI.
- **Commits**: mensajes en imperativo, un cambio lógico por commit.
- **Errores**: las API Routes devuelven JSON `{ error }` con status HTTP correcto
  (400/401/403/404/500); nunca tragarse errores en silencio.

### CSS / Layout (Tailwind v4 — obligatorio)

Tailwind v4 genera sus utilities dentro de `@layer utilities`. Todo CSS escrito
**fuera** de un `@layer` tiene mayor prioridad en la cascada, independientemente de
la especificidad. Un reset global como `* { margin: 0; padding: 0; }` **anula**
utilidades como `mx-auto` y rompe el centrado.

1. En `globals.css` usar **solo** `*, *::before, *::after { box-sizing: border-box; }`
   fuera de capas. El preflight de Tailwind ya resetea márgenes y paddings.
2. Centrado: patrón **contenedor exterior ancho completo + `<div>` interior centrado**:
   ```tsx
   // ✅ Correcto
   <main>
     <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
   </main>
   ```
3. CSS personalizado que compita con utilities → envolverlo en `@layer utilities { ... }`.

## 📊 Métricas (cómo recolectarlas)

- Latencias: `npx autocannon -c 50 -d 10 http://localhost:3000/api/products`
  (repetir para `/api/cart` y `/api/checkout` con sesión). Objetivos en `PROMPT.md` §5.
- MongoDB: `db.collection.find(...).explain("executionStats")` en `mongosh` para
  verificar índices y tiempos.
- Registrar los resultados en el README (sección métricas) antes de la entrega.

## 🌐 Deployment público

```bash
npm run build                  # comprobación local previa (standalone)

# Verificación post-deployment
curl -I https://<dominio>/

# Rollback: git revert <commit> && git push, y re-deploy
```

Plataforma objetivo: `TODO` (candidato Cloud Run, como bonos — ver su AGENTS.md
para el comando `gcloud run deploy` con `--set-secrets`).

### ⚠️ CI en gitlab.codecrypto.academy — lecciones previas (bonos/videocapture, OBLIGATORIO leer antes de tocar `.gitlab-ci.yml`)

Restricciones reales de la infraestructura de la academia, ya sufridas y resueltas
(detalle completo en `RETROSPECTIVA.md` §lecciones heredadas):

1. Pipeline basado en los templates compartidos `internos/templates-cicd`
   (opt-in). Este proyecto incluye `provision-mongo.yml` + `build-deploy.yml`.
2. **Único runner operativo**: `cloudrun-ephemeral` (tag `cloudrun`), executor
   **shell** — ignora `image:` (no hay Alpine ni `apk`). Solo funciona el job
   `build` (usa `buildah`), que requiere **Dockerfile multi-stage standalone** y
   `output: "standalone"` en `next.config.ts` (ambos ya presentes). Jobs sin tag
   `cloudrun` se quedan en `pending` para siempre.
3. **`wake_cloudrun_runners` / `provision_*` / `deploy` desactivados con
   `rules: when: never`** — con `allow_failure: true` el pipeline queda "passed
   with warnings", no verde limpio.
4. **No cachear `node_modules/` y a la vez pasarlo como artifacts**: cuelga los
   jobs. Cachear solo `.npm/`. `timeout:` explícito por job (build 15m, lint/test 10m).
5. El código acepta variables locales (`MONGODB_URI`) **y** las de plataforma
   (`MONGO_HOST`/`MONGO_PORT`/`MONGO_USER`/`MONGO_PASSWORD`/`MONGO_DB`).
6. Síntoma "no runners online" → no es un bug del repo: escalar al admin pidiendo
   `docker system prune -f` + reinicio del runner, citando el precedente
   `video`/`videocapture`.

## 📦 Repositorios y sincronización

| Repositorio | URL |
|---|---|
| GitHub | `https://github.com/OSCARJORGERAPP/ecommerce` |
| GitLab | `https://gitlab.codecrypto.academy/ojrapp/ecommerce` |

Subir solo cuando: pipeline CI verde limpio, tests al 100%, build sin errores y
entregables de `PROMPT.md` §7 completos. **Todo push a main se replica en AMBOS
remotes** (la fuente de verdad es el local).

## 📒 Documentación viva (obligación del agente)

Tras cada cambio relevante:
- Si cambia instalación/arranque → actualizar `README.md` y `QUICKSTART.md`.
- Cada problema encontrado → entrada **problema → causa → solución** en `RETROSPECTIVA.md`.
- Si cambia el alcance o el stack → re-sincronizar `PROMPT.md` (y su manifiesto §7)
  con la skill `spec-docs`.
- Al cerrar el proyecto → completar `REFLEXION-FINAL.md`.
