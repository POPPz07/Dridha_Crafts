"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { api } from "@/lib/api";
import type { User } from "@/types/user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    // Silent pre-warming ping to wake up backend (e.g. Render free tier cold-start) proactively on visit
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${apiBase}/api/health`, { method: "GET", keepalive: true }).catch(() => {});
    } catch {
      // Ignore background wake-up errors
    }

    const supabase = createClient();

    const handleSessionChange = async (session: any) => {
      if (session?.user) {
        const prevUser = useAuthStore.getState().user;
        if (prevUser && prevUser.id !== session.user.id) {
          // Different user signed in, clear previous user's cart
          useCartStore.getState().clearCart();
        }

        const appRole = (session.user.app_metadata?.role as "admin" | "customer") || "customer";

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User",
          phone: session.user.phone || null,
          role: appRole,
          created_at: session.user.created_at,
        });

        // Sync with backend profile (authoritative source of truth for DB role & auto-provisions user row)
        try {
          const profile = await api.get<User>("/api/auth/me", {
            token: session.access_token,
          });
          if (profile) {
            setUser(profile);
          }
        } catch {
          // Gracefully keep the session-derived profile if backend is unreachable
        }

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
