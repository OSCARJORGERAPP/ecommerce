// Tests de validación del CRUD de productos (RF-11).
import { describe, expect, it } from "vitest";
import { validateProduct } from "@/lib/products";

const valid = {
  name: "Teclado",
  description: "Mecánico",
  price: 8999,
  stock: 10,
  category: "Periféricos",
};

describe("validateProduct", () => {
  it("acepta un producto válido y activa por defecto", () => {
    const result = validateProduct(valid);
    expect(result).not.toBeNull();
    expect(result!.active).toBe(true);
  });

  it("respeta active: false", () => {
    expect(validateProduct({ ...valid, active: false })!.active).toBe(false);
  });

  it("rechaza precio con decimales (debe ser céntimos enteros)", () => {
    expect(validateProduct({ ...valid, price: 89.99 })).toBeNull();
  });

  it("rechaza precio y stock negativos", () => {
    expect(validateProduct({ ...valid, price: -1 })).toBeNull();
    expect(validateProduct({ ...valid, stock: -1 })).toBeNull();
  });

  it("rechaza nombre o categoría vacíos, body nulo y tipos incorrectos", () => {
    expect(validateProduct({ ...valid, name: "  " })).toBeNull();
    expect(validateProduct({ ...valid, category: "" })).toBeNull();
    expect(validateProduct(null)).toBeNull();
    expect(validateProduct({ ...valid, price: "8999" })).toBeNull();
  });

  it("recorta espacios en name y category", () => {
    const result = validateProduct({ ...valid, name: " Teclado ", category: " Periféricos " });
    expect(result!.name).toBe("Teclado");
    expect(result!.category).toBe("Periféricos");
  });
});
