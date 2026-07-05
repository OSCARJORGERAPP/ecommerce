// Seed de datos (RF-14): índices + usuario admin + productos de ejemplo.
// Uso: npm run seed  (requiere MongoDB corriendo y .env.local)
import { MongoClient } from "mongodb";
import { hashPassword } from "../lib/jwt";
import { ensureIndexes } from "../lib/indexes";
import type { ProductDoc, UserDoc } from "../lib/types";

const ADMIN_EMAIL = "admin@ecommerce.dev";
const ADMIN_PASSWORD = "admin123";

const PRODUCTS: Omit<ProductDoc, "_id" | "createdAt">[] = [
  { name: "Teclado mecánico 75%", description: "Switches marrones, hot-swap, retroiluminado.", price: 8999, stock: 25, category: "Periféricos", active: true, image: "/products/teclado.svg" },
  { name: "Ratón inalámbrico", description: "Sensor 26K DPI, 63 g, USB-C.", price: 5499, stock: 40, category: "Periféricos", active: true, image: "/products/raton.svg" },
  { name: "Monitor 27\" 1440p", description: "IPS 165 Hz, 1 ms, HDR400.", price: 27900, stock: 12, category: "Monitores", active: true, image: "/products/monitor.svg" },
  { name: "Auriculares con micrófono", description: "Cancelación de ruido, 30 h de batería.", price: 12900, stock: 30, category: "Audio", active: true, image: "/products/auriculares.svg" },
  { name: "Webcam 4K", description: "Enfoque automático, corrección de luz.", price: 9900, stock: 18, category: "Vídeo", active: true, image: "/products/webcam.svg" },
  { name: "Hub USB-C 8 en 1", description: "HDMI 4K, 2×USB-A, SD, PD 100W.", price: 4599, stock: 50, category: "Accesorios", active: true, image: "/products/hub.svg" },
  { name: "SSD NVMe 2 TB", description: "PCIe 4.0, 7300 MB/s lectura.", price: 14900, stock: 22, category: "Almacenamiento", active: true, image: "/products/ssd.svg" },
  { name: "Silla ergonómica", description: "Soporte lumbar, malla transpirable.", price: 34900, stock: 8, category: "Mobiliario", active: true, image: "/products/silla.svg" },
];

async function main() {
  // 127.0.0.1 explícito: "localhost" puede resolver a ::1 y caer en otro mongod (RETROSPECTIVA)
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
  const client = await new MongoClient(uri, { serverSelectionTimeoutMS: 3000 }).connect();
  const db = client.db(process.env.MONGO_DB ?? "ecommerce");

  await ensureIndexes(db);
  console.log("✔ Índices creados");

  const users = db.collection<UserDoc>("users");
  const existingAdmin = await users.findOne({ email: ADMIN_EMAIL });
  if (!existingAdmin) {
    await users.insertOne({
      email: ADMIN_EMAIL,
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      role: "admin",
      name: "Admin",
      createdAt: new Date(),
    });
    console.log(`✔ Admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log("• Admin ya existe, no se toca");
  }

  const products = db.collection<ProductDoc>("products");
  if ((await products.countDocuments()) === 0) {
    await products.insertMany(PRODUCTS.map((p) => ({ ...p, createdAt: new Date() })));
    console.log(`✔ ${PRODUCTS.length} productos insertados`);
  } else {
    // Backfill: asignar imagen a los productos del seed que aún no tengan
    let updated = 0;
    for (const p of PRODUCTS) {
      const r = await products.updateOne(
        { name: p.name, image: { $exists: false } },
        { $set: { image: p.image } }
      );
      updated += r.modifiedCount;
    }
    console.log(`• Ya hay productos (${updated} imágenes backfilleadas)`);
  }

  await client.close();
  console.log("Seed completado ✅");
}

main().catch((err) => {
  console.error("Seed falló:", err.message);
  process.exit(1);
});
