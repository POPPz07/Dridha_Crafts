import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  productIds: string[];

  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  setProductIds: (ids: string[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      addToWishlist: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds
            : [...state.productIds, productId],
        })),

      removeFromWishlist: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        })),

      toggleWishlist: (productId) => {
        const { productIds } = get();
        if (productIds.includes(productId)) {
          set({ productIds: productIds.filter((id) => id !== productId) });
        } else {
          set({ productIds: [...productIds, productId] });
        }
      },

      isInWishlist: (productId) => get().productIds.includes(productId),
      clearWishlist: () => set({ productIds: [] }),
      setProductIds: (ids) => set({ productIds: ids }),
    }),
    {
      name: "dridha-wishlist",
    }
  )
);
