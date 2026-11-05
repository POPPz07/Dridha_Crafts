"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const supabase = createClient();

    const handleSessionChange = (session: any) => {
      if (session?.user) {
        const prevUser = useAuthStore.getState().user;
        if (prevUser && prevUser.id !== session.user.id) {
          // Different user signed in, clear previous user's cart
          useCartStore.getState().clearCart();
        }

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User",
          phone: session.user.phone || null,
          role: "customer",
          created_at: session.user.created_at,
        });

        // Resume pending Add to Cart action once if one exists
        const pending = useAuthStore.getState().consumePendingCartItem();
        if (pending) {
          useCartStore.getState().addItem(pending);
          useCartStore.getState().openCart();
          useAuthStore.getState().closeAuthModal();
        }
      } else {
        const prevUser = useAuthStore.getState().user;
        if (prevUser) {
          useCartStore.getState().clearCart();
        }
        setUser(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}

