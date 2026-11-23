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
        const currentEmail = session.user.email?.trim().toLowerCase();
        const prevEmail = prevUser?.email?.trim().toLowerCase();

        // Only clear cart if a genuinely DIFFERENT user account signed in
        if (prevUser && prevEmail && currentEmail && prevEmail !== currentEmail) {
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

        // Sync with backend profile (authoritative source of truth for DB role & active status)
        try {
          const profile = await api.get<User>("/api/auth/me", {
            token: session.access_token,
          });
          if (profile) {
            setUser(profile);
          }
        } catch (err: any) {
          // If backend returns 401/403/404 (e.g. account deleted or deactivated), sign out immediately
          if (
            err?.status === 401 ||
            err?.status === 403 ||
            err?.status === 404 ||
            err?.message?.includes("no longer exists")
          ) {
            await supabase.auth.signOut().catch(() => {});
            useAuthStore.getState().logout();
            setUser(null);
            return;
          }
        }

        // Resume pending Add to Cart action once if one exists
        const pending = useAuthStore.getState().consumePendingCartItem();
        if (pending) {
          useCartStore.getState().addItem(pending);
          useCartStore.getState().openCart();
          useAuthStore.getState().closeAuthModal();
        }
      } else {
        // If session is null/logged out, clear auth user state only.
        setUser(null);
      }
      setLoading(false);
    };

    // Real-time active account validation (checks if user was deleted or session revoked by admin)
    const verifyActiveSession = async () => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      try {
        const { data: { user: sbUser }, error } = await supabase.auth.getUser();
        if (error || !sbUser) {
          // User account was deleted in Supabase Auth by admin
          await supabase.auth.signOut().catch(() => {});
          useAuthStore.getState().logout();
          setUser(null);
          if (
            window.location.pathname.startsWith("/profile") ||
            window.location.pathname.startsWith("/admin")
          ) {
            window.location.href =
              "/login?redirect=" + encodeURIComponent(window.location.pathname);
          }
          return;
        }

        // Also verify database presence via /api/auth/me
        await api.get<User>("/api/auth/me");
      } catch (err: any) {
        if (
          err?.status === 401 ||
          err?.status === 403 ||
          err?.status === 404 ||
          err?.message?.includes("no longer exists")
        ) {
          await supabase.auth.signOut().catch(() => {});
          useAuthStore.getState().logout();
          setUser(null);
          if (
            window.location.pathname.startsWith("/profile") ||
            window.location.pathname.startsWith("/admin")
          ) {
            window.location.href =
              "/login?redirect=" + encodeURIComponent(window.location.pathname);
          }
        }
      }
    };

    // Check when tab becomes visible (user switches back to Dridha Crafts tab)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        verifyActiveSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Background verification interval every 15 seconds
    const intervalId = setInterval(verifyActiveSession, 15000);

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
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(intervalId);
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
