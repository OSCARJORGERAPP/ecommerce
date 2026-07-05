import type { ObjectId } from "mongodb";

export type Role = "admin" | "customer";
export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  createdAt: Date;
}

export interface ProductDoc {
  _id?: ObjectId;
  name: string;
  description: string;
  /** Precio en céntimos (entero) — nunca float */
  price: number;
  stock: number;
  category: string;
  active: boolean;
  /** Ruta de imagen (p. ej. /products/teclado.svg); opcional */
  image?: string;
  createdAt: Date;
}

export interface CartItem {
  productId: string;
  name: string;
  /** Céntimos, copiado del producto al añadir */
  price: number;
  qty: number;
}

export interface CartDoc {
  _id?: ObjectId;
  customerId: string;
  items: CartItem[];
  updatedAt: Date;
}

export interface OrderDoc {
  _id?: ObjectId;
  customerId: string;
  items: CartItem[];
  /** Céntimos */
  total: number;
  status: OrderStatus;
  stripeSessionId?: string;
  createdAt: Date;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: Role;
}
