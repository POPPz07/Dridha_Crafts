import { create } from "zustand";
import type { CartItem, User } from "@/types/user";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalView: "login" | "signup";
  pendingCartItem: CartItem | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  openAuthModal: (view?: "login" | "signup") => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: "login" | "signup") => void;
  setPendingCartItem: (item: CartItem | null) => void;
  consumePendingCartItem: () => CartItem | null;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,
  isAuthModalOpen: false,
  authModalView: "login",
  pendingCartItem: null,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  openAuthModal: (view = "login") => set({ isAuthModalOpen: true, authModalView: view }),
  closeAuthModal: () => set({ isAuthModalOpen: false, pendingCartItem: null }),
  setAuthModalView: (authModalView) => set({ authModalView }),
  setPendingCartItem: (pendingCartItem) => set({ pendingCartItem }),
  consumePendingCartItem: () => {
    const item = get().pendingCartItem;
    if (item) {
      set({ pendingCartItem: null });
    }
    return item;
  },
  logout: () => set({ user: null, pendingCartItem: null }),
}));
