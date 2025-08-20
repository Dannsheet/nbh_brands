"use client";

import { createContext, useContext, useCallback } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";

const CartContext = createContext();

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 401) {
      // Don't throw for 401, as it's a valid state for logged-out users
      return { items: [] }; 
    }
    throw new Error("Error al cargar carrito");
  }
  return res.json();
};

export function CartProvider({ children }) {
  const { data, error, mutate } = useSWR("/api/carrito", fetcher, {
    revalidateOnFocus: false,
  });

  const items = data?.items || [];

  // 🔹 Calcular cantidad total de items
  const totalCantidad = items.reduce((acc, item) => acc + item.cantidad, 0);

  // 🔹 Añadir item al carrito
  const addToCart = useCallback(
    async ({ producto_id, producto_nombre, color, talla, cantidad }) => {
      try {
        const res = await fetch("/api/carrito", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ producto_id, producto_nombre, color, talla, cantidad }),
          credentials: 'include',
        });

        if (!res.ok) throw new Error("Error al agregar al carrito");

        const { item } = await res.json();

        // Optimistic update
        mutate({ items: [...items, item] }, false);

        // ✅ Mensaje más profesional y descriptivo
        toast.success(
          `🛒 ${cantidad} ${producto_nombre || "producto"} (${color}, ${talla}) agregado${cantidad > 1 ? "s" : ""} al carrito`
        );
      } catch (err) {
        console.error(err);
        toast.error("❌ No se pudo agregar al carrito");
      } finally {
        mutate();
      }
    },
    [items, mutate]
  );

  // 🔹 Eliminar item del carrito
  const removeFromCart = useCallback(
    async (itemId) => {
      try {
        mutate({ items: items.filter((i) => i.id !== itemId) }, false);
        await fetch("/api/carrito", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemId }),
          credentials: 'include',
        });
        toast.success("🗑️ Producto eliminado del carrito");
      } catch (err) {
        console.error(err);
        toast.error("❌ Error al eliminar producto");
      } finally {
        mutate();
      }
    },
    [items, mutate]
  );

  // 🔹 Actualizar cantidad
  const updateQuantity = useCallback(
    async (itemId, cantidad) => {
      try {
        mutate(
          {
            items: items.map((i) =>
              i.id === itemId ? { ...i, cantidad } : i
            ),
          },
          false
        );

        await fetch("/api/carrito", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemId, cantidad }),
          credentials: 'include',
        });

        toast.success("🔄 Cantidad actualizada");
      } catch (err) {
        console.error(err);
        toast.error("❌ Error al actualizar cantidad");
      } finally {
        mutate();
      }
    },
    [items, mutate]
  );

  // 🔹 Vaciar carrito (útil en checkout o logout)
  const clearCart = useCallback(async () => {
    try {
      mutate({ items: [] }, false);
      await fetch("/api/carrito/clear", { method: "POST", credentials: 'include' });
      toast.success("🧹 Carrito vaciado");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error al vaciar carrito");
    } finally {
      mutate();
    }
  }, [mutate]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCantidad,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isLoading: !data && !error,
        isError: error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
