"use client";

import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase";
import type { CartItem } from "@/types/user";

export function useAuthGatedAddToCart() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const setPendingCartItem = useAuthStore((s) => s.setPendingCartItem);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  /**
   * Adds an item to the cart if authenticated, or opens AuthModal and saves pending intent.
   *
   * @param item The complete CartItem to add.
   * @param count Number of times to add (defaults to 1).
   * @returns Promise<boolean> - true if immediately added, false if gated by authentication.
   */
  const addToCart = async (item: CartItem, count: number = 1): Promise<boolean> => {
    // 1. Authenticated customer: add immediately
    if (user) {
      for (let i = 0; i < count; i++) {
        addItem(item);
      }
      openCart();
      return true;
    }

    // 2. If AuthProvider session hydration is still in progress, check session directly
    if (isLoading) {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          for (let i = 0; i < count; i++) {
            addItem(item);
          }
          openCart();
          return true;
        }
      } catch {
        // Fallback to auth modal
      }
    }

    // 3. Unauthenticated visitor: record pending action and prompt sign-in / registration
    const pendingItem: CartItem = {
      ...item,
      quantity: (item.quantity || 1) * count,
    };
    setPendingCartItem(pendingItem);
    openAuthModal("login");
    return false;
  };

  return { addToCart };
}

