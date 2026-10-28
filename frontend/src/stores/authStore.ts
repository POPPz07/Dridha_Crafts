import { create } from "zustand";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalView: "login" | "signup";

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  openAuthModal: (view?: "login" | "signup") => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: "login" | "signup") => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  isAuthModalOpen: false,
  authModalView: "login",

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  openAuthModal: (view = "login") => set({ isAuthModalOpen: true, authModalView: view }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setAuthModalView: (authModalView) => set({ authModalView }),
  logout: () => set({ user: null }),
}));
