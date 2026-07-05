# ⚡ QUICKSTART — de cero a corriendo en < 5 min

> Requisitos: Node 20+, Docker Desktop **arrancado**, cuenta de prueba de Stripe.

```bash
# 1. Dependencias
npm install

# 2. MongoDB
docker run -d --name ecommerce-mongo -p 27017:27017 mongo:7

# 3. Variables de entorno
cp .env.example .env.local
# → rellenar AUTH_SECRET y las claves sk_test_/pk_test_/whsec_ de Stripe

# 4. Seed (productos + usuario admin)
npm run seed

# 5. Arrancar
npm run dev            # → http://localhost:3000
```

**Probar el pago** (opcional, en otra terminal):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Tarjeta de prueba: 4242 4242 4242 4242, cualquier fecha futura y CVC
```

**Credenciales admin del seed**: `admin@ecommerce.dev` / `admin123`.

¿Problemas? Mira primero `RETROSPECTIVA.md` (incluye lecciones heredadas de
proyectos anteriores: Docker en Windows, CI de GitLab, Vitest, ESLint 9).
