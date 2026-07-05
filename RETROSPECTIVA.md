# 📓 RETROSPECTIVA — bitácora de problemas y soluciones

> Una entrada por incidente, en orden cronológico. Formato: **problema → causa → solución**.

## ⚠️ Lecciones heredadas — CI en gitlab.codecrypto.academy (bonos / videocapture)

Registradas ANTES de empezar para no perder tiempo re-descubriendo los mismos errores.
Fuente: `bonos/AGENTS.md` §CI y `videocapture/RETROSPECTIVA.md` §7-§9. Aplican al
tocar `.gitlab-ci.yml` de este proyecto:

1. **Templates compartidos**: el pipeline se basa en `internos/templates-cicd`
   (modelo opt-in: incluir solo los `templates/provision-*.yml` / `build-deploy.yml`
   que el proyecto use). Ecommerce usa MongoDB → `provision-mongo.yml` +
   `build-deploy.yml` (sin postgres ni rustfs).
2. **Único runner operativo**: `cloudrun-ephemeral` (tag `cloudrun`), executor
   **shell** — **ignora `image:`** (no hay Alpine ni `apk`; node/npm en el host no
   garantizados). Solo funciona el job `build` de los templates (usa `buildah`).
   Jobs sin tag `cloudrun` se quedan en `pending` para siempre.
3. **El job `build` requiere** `Dockerfile` multi-stage standalone y
   `output: "standalone"` en `next.config.ts` (buildah construye la imagen).
4. **`wake_cloudrun_runners` / `provision_*` / `deploy` se saltan con
   `rules: when: never`** (necesitan un runner persistente que no existe; además
   asumen imagen Alpine con `apk`, que el executor shell ignora → fallan en su
   primer paso). Con `allow_failure: true` el pipeline queda "passed with
   warnings", NO verde limpio — hay que desactivarlos del todo.
5. **No cachear `node_modules/` y a la vez pasarlo como artifacts** entre jobs:
   con ~400 paquetes y binarios nativos, duplicar compresión/subida/descarga
   cuelga los jobs o agota el timeout en runners compartidos. Cachear solo `.npm/`.
6. **`timeout:` explícito por job** (build ~15m, lint/test ~10m): un runner
   degradado debe fallar rápido, no colgarse una hora.
7. **Variables de plataforma**: el código debe aceptar tanto variables locales
   (`MONGODB_URI`, etc.) como las que inyecta la plataforma en runtime
   (`MONGO_HOST`/`MONGO_PORT`/`MONGO_USER`/`MONGO_PASSWORD`/`MONGO_DB`),
   construyendo la URI a partir de estas últimas cuando las primeras faltan.
8. **Síntoma "no runners online"**: no es un bug del repo — el runner compartido
   se congela cuando el disco del host se llena de capas Docker; escalar al admin
   pidiendo `docker system prune -f` + reinicio, citando el precedente de los
   proyectos `video`/`videocapture`.
9. **Build de producción y variables de entorno**: no crear clientes (Mongo,
   Stripe) ni validar env vars en el **top-level del módulo** — Next.js evalúa los
   módulos durante `next build` y el `throw` salta en build-time (el runner de CI
   no tiene esas variables). Usar funciones *lazy* (`getDb()`, `getStripe()`).

Otras lecciones no-CI heredadas de `bonos/RETROSPECTIVA.md` que aplican a este stack:

- **`it.skipIf` (Vitest)** recibe un **booleano**, no una función; y se evalúa en la
  fase de colección, antes de `beforeAll` → conectar a la BD en la carga del módulo
  (top-level await con `serverSelectionTimeoutMS` corto) y pasar `it.skipIf(!db)`.
  Si una suite de integración "pasa" sospechosamente rápido, mirar el contador de skipped.
- **ESLint 9 + Next 16, regla `react-hooks/set-state-in-effect`**: no llamar dentro de
  `useEffect` funciones que hacen `setState` (ni tras `await`). Patrón: el fetch
  devuelve datos y el `setState` va en el callback — `useEffect(() => { fetchAll().then(apply); }, [fetchAll])`.
  En event handlers sí está permitido.
- **Docker Desktop en Windows**: si `docker run` falla con "failed to connect to the
  docker API at npipe:...", arrancar `Docker Desktop.exe` y esperar a que `docker info` responda.

---

### 2026-07-04 — Test de `formatCents` fallaba esperando "1.234,56 €"
- **Problema**: el test esperaba separador de miles en `12,34 €` × 100 = `1.234,56 €`, pero `Intl` devolvía `1234,56 €`.
- **Causa**: no es un bug — el locale `es-ES` en CLDR tiene `minimumGroupingDigits: 2`: los números de 4 dígitos NO se agrupan (`1234`), solo a partir de 5 (`12.345`).
- **Solución**: ajustar la expectativa del test (`1234,56 €` correcto; verificar la agrupación con un importe de 5+ dígitos).

### 2026-07-04 — "Mis pedidos" mostraba pedidos pendientes fantasma
- **Problema**: junto al pedido pagado real aparecían dos pedidos `pending` que nadie había comprado.
- **Causa**: doble: (1) `POST /api/checkout` insertaba el pedido ANTES de llamar a Stripe — si Stripe fallaba (claves placeholder en una prueba), el pedido quedaba huérfano; (2) las pruebas e2e con curl crearon checkouts que nunca se pagaron (eso último es comportamiento normal de un checkout abandonado).
- **Solución**: try/catch en el checkout que borra el pedido si Stripe falla (502 al cliente); los dos artefactos de prueba se marcaron `cancelled`.

### 2026-07-04 — Dos MongoDB distintos respondían en `localhost:27017`
- **Problema**: una consulta a `mongodb://localhost:27017` no encontraba la base `ecommerce`, pero la app sí la veía.
- **Causa**: había DOS mongod escuchando el 27017: el **servicio nativo de Windows** (solo IPv4, `127.0.0.1`) y el contenedor Docker `bonos-mongo` (IPv6). `localhost` puede resolver a `::1` (→ contenedor) o a `127.0.0.1` (→ nativo) según el cliente, así que cada conexión podía caer en un servidor distinto. Los datos de ecommerce estaban en el nativo (Docker estuvo apagado durante el desarrollo; nunca llegó a crearse `ecommerce-mongo`).
- **Solución**: fijar `MONGODB_URI=mongodb://127.0.0.1:27017` (IPv4 explícito) en `.env.local`/`.env.example`.
- **Prevención**: en Windows, comprobar `Get-NetTCPConnection -LocalPort 27017 -State Listen` si los datos "desaparecen"; con un servicio MongoDB nativo instalado, no hace falta el contenedor Docker de Mongo.

<!-- Añadir aquí cada nuevo incidente de ESTE proyecto: problema → causa → solución -->
