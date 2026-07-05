import type { ProductDoc } from "./types";

/** Valida el payload de crear/editar producto (RF-11). Precio en céntimos. */
export function validateProduct(
  body: unknown
): Omit<ProductDoc, "_id" | "createdAt"> | null {
  const b = body as Record<string, unknown> | null;
  if (
    !b ||
    typeof b.name !== "string" || !b.name.trim() ||
    typeof b.description !== "string" ||
    typeof b.price !== "number" || !Number.isInteger(b.price) || b.price < 0 ||
    typeof b.stock !== "number" || !Number.isInteger(b.stock) || b.stock < 0 ||
    typeof b.category !== "string" || !b.category.trim() ||
    (b.image !== undefined && typeof b.image !== "string")
  ) {
    return null;
  }
  return {
    name: b.name.trim(),
    description: b.description,
    price: b.price,
    stock: b.stock,
    category: b.category.trim(),
    active: b.active !== false,
    ...(b.image && typeof b.image === "string" ? { image: b.image.trim() } : {}),
  };
}
