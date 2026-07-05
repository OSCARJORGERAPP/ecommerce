"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCents } from "@/lib/format";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  active: boolean;
}

const EMPTY = { name: "", description: "", price: "", stock: "", category: "" };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    const res = await fetch("/api/admin/products");
    return res.json();
  }, []);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, [fetchProducts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name,
      description: form.description,
      // El formulario trabaja en euros; la API siempre en céntimos (enteros)
      price: Math.round(Number(form.price) * 100),
      stock: Number(form.stock),
      category: form.category,
    };
    const res = await fetch(
      editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) {
      setForm(EMPTY);
      setEditingId(null);
      fetchProducts().then(setProducts);
    } else {
      setError((await res.json()).error);
    }
  }

  function startEdit(p: Product) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description,
      price: (p.price / 100).toString(),
      stock: p.stock.toString(),
      category: p.category,
    });
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, active: !p.active }),
    });
    fetchProducts().then(setProducts);
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar este producto?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    fetchProducts().then(setProducts);
  }

  if (!products) return <p className="text-zinc-500">Cargando productos…</p>;

  const inputCls = "border border-zinc-700 bg-zinc-950 text-zinc-100 rounded-md px-3 py-2";

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={submit}
        className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 grid grid-cols-2 lg:grid-cols-6 gap-4 items-end"
      >
        <label className="flex flex-col gap-1 text-sm col-span-2">
          Nombre
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Precio (€)
          <input
            className={inputCls}
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Stock
          <input
            className={inputCls}
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Categoría
          <input
            className={inputCls}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
        </label>
        <button
          type="submit"
          className="bg-amber-400 text-zinc-950 px-4 py-2 rounded-md font-semibold hover:bg-amber-300 transition-colors"
        >
          {editingId ? "Guardar" : "Crear"}
        </button>
        <label className="flex flex-col gap-1 text-sm col-span-2 lg:col-span-6">
          Descripción
          <textarea
            className={inputCls}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY);
            }}
            className="text-sm text-zinc-500 underline text-left"
          >
            Cancelar edición
          </button>
        )}
        {error && <p className="text-sm text-red-400 col-span-2 lg:col-span-6">{error}</p>}
      </form>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {products.map((p) => (
              <tr key={p._id}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3">{formatCents(p.price)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.active ? "bg-green-400/10 text-green-400" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {p.active ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => startEdit(p)} className="text-sm underline mr-3">
                    Editar
                  </button>
                  <button
                    onClick={() => remove(p._id)}
                    className="text-sm text-red-400 underline"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
