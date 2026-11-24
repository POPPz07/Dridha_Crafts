"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } =
    useCartStore();
  const router = useRouter();
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  if (!isOpen) return null;

  const subtotalAmount = subtotal();
  const isOnlyMobileStand =
    items.length > 0 &&
    items.every(
      (i) =>
        i.product?.slug === "mobile-stand" ||
        i.product_id === "31e508df-81ec-41cb-9446-79855ce4e9bd" ||
        (i.product?.name &&
          i.product.name.toLowerCase().includes("mobile stand") &&
          !i.product.name.toLowerCase().includes("trio") &&
          !i.product.name.toLowerCase().includes("duo"))
    );
  const deliveryCharges = items.length === 0 ? 0 : isOnlyMobileStand ? 19 : 39;
  const estimatedTotal = items.length > 0 ? subtotalAmount + deliveryCharges : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-cream border-l border-warmgrey shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 border-b border-warmgrey/60 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-brand-green">
                Your Cart ({items.length})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1 rounded-full text-charcoal/60 hover:text-charcoal hover:bg-warmgrey/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="font-display text-2xl text-charcoal/50">Your cart is empty</p>
                <p className="text-sm text-charcoal/60">
                  Explore our handcrafted wooden collection and bring natural warmth to your desk.
                </p>
                <Button variant="primary" onClick={closeCart} className="mt-4">
                  Explore Collection
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Delivery banner */}
                <div className="bg-sage/20 border border-sage/40 rounded-lg p-3 text-xs text-brand-green-dark flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
                  <span>
                    <strong>Pan-India Delivery!</strong> Custom products accepted.
                  </span>
                </div>

                {/* Cart Items */}
                {items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.variant_id || "default"}`}
                    className="flex gap-4 p-3 bg-white rounded-xl border border-warmgrey/70 shadow-sm"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-warmgrey/30 shrink-0">
                      {item.product.primary_image_url ? (
                        <Image
                          src={item.product.primary_image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-charcoal/40">
                          Item
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm text-charcoal leading-tight">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-charcoal/40 hover:text-terracotta transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.variant && (
                          <p className="text-xs text-charcoal/60 mt-0.5">
                            Finish: {item.variant.variant_name}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-brand-green mt-1">
                          {formatPrice(item.variant?.price_override ?? item.product.price)}
                        </p>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 rounded bg-warmgrey/50 hover:bg-warmgrey text-charcoal disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded bg-warmgrey/50 hover:bg-warmgrey text-charcoal"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Subtotal & Action */}
          {items.length > 0 && (
            <div className="p-6 border-t border-warmgrey/70 bg-white/70 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-charcoal/60">Subtotal</span>
                <span className="font-semibold text-charcoal">{formatPrice(subtotalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-charcoal/60">Delivery Charges</span>
                <span className="font-semibold text-charcoal">{formatPrice(deliveryCharges)}</span>
              </div>
              <div className="border-t border-warmgrey/50 pt-2 flex justify-between items-center">
                <span className="font-display text-lg font-bold text-charcoal">Estimated Total</span>
                <span className="font-display text-2xl font-bold text-brand-green">{formatPrice(estimatedTotal)}</span>
              </div>
              <Button
                variant="primary"
                className="w-full py-4 text-base"
                rightIcon={!isNavigatingToCheckout ? <ArrowRight className="w-4 h-4" /> : undefined}
                isLoading={isNavigatingToCheckout}
                disabled={isNavigatingToCheckout}
                onClick={() => {
                  setIsNavigatingToCheckout(true);
                  router.push("/checkout");
                  setTimeout(() => {
                    closeCart();
                    setIsNavigatingToCheckout(false);
                  }, 500);
                }}
              >
                {isNavigatingToCheckout ? "Opening Checkout..." : "Proceed to Checkout"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
