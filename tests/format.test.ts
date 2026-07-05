// Tests unitarios de dinero (céntimos) y transiciones de pedido.
// Cubren: RF-05 (formato de precio), RF-06 (total del carrito), RF-13 (estados).
import { describe, expect, it } from "vitest";
import { canTransition, cartTotal, formatCents, ORDER_TRANSITIONS } from "@/lib/format";

describe("formatCents", () => {
  it("formatea céntimos a euros con separadores españoles", () => {
    // es-ES no agrupa números de 4 dígitos (CLDR minimumGroupingDigits=2)
    expect(formatCents(123456)).toMatch(/1234,56\s*€/);
    expect(formatCents(1234567)).toMatch(/12\.345,67\s*€/);
  });

  it("formatea cero", () => {
    expect(formatCents(0)).toMatch(/0,00\s*€/);
  });

  it("no pierde precisión con importes que romperían en float", () => {
    // 0.1 + 0.2 !== 0.3 en float; en céntimos 10 + 20 === 30
    expect(formatCents(10 + 20)).toMatch(/0,30\s*€/);
  });
});

describe("cartTotal", () => {
  it("carrito vacío = 0", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("suma price*qty en enteros", () => {
    const items = [
      { price: 8999, qty: 2 },
      { price: 5499, qty: 1 },
    ];
    expect(cartTotal(items)).toBe(23497);
    expect(Number.isInteger(cartTotal(items))).toBe(true);
  });
});

describe("transiciones de estado de pedido (RF-13)", () => {
  it("permite el flujo feliz pending → paid → shipped", () => {
    expect(canTransition("pending", "paid")).toBe(true);
    expect(canTransition("paid", "shipped")).toBe(true);
  });

  it("permite cancelar antes de enviar", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("paid", "cancelled")).toBe(true);
  });

  it("prohíbe retrocesos y estados finales", () => {
    expect(canTransition("paid", "pending")).toBe(false);
    expect(canTransition("shipped", "cancelled")).toBe(false);
    expect(canTransition("cancelled", "paid")).toBe(false);
    expect(ORDER_TRANSITIONS.shipped).toHaveLength(0);
  });
});
