"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, QrCode, Banknote } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart, subtotal } =
    useCartStore();
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "qr_modal" | "cod_success">(
    "cart"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentChoice, setPaymentChoice] = useState<"cod" | "qr">("qr");

  if (!isOpen) return null;

  const total = subtotal();

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert("Please fill in your delivery details.");
      return;
    }
    if (paymentChoice === "qr") {
      setCheckoutStep("qr_modal");
    } else {
      setCheckoutStep("cod_success");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          closeCart();
          setCheckoutStep("cart");
        }}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-cream border-l border-warmgrey shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 border-b border-warmgrey/60 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-brand-green">
                {checkoutStep === "cart"
                  ? `Your Cart (${items.length})`
                  : checkoutStep === "checkout"
                  ? "Express Checkout"
                  : checkoutStep === "qr_modal"
                  ? "Google Pay / UPI Scan"
                  : "Order Confirmed!"}
              </h2>
            </div>
            <button
              onClick={() => {
                closeCart();
                setCheckoutStep("cart");
              }}
              className="p-1 rounded-full text-charcoal/60 hover:text-charcoal hover:bg-warmgrey/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* STEP 1: CART LIST */}
            {checkoutStep === "cart" && (
              <>
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <p className="font-display text-2xl text-charcoal/50">Your cart is empty</p>
                    <p className="text-sm text-charcoal/60">
                      Explore our handcrafted Kashmiri walnut collection and bring natural warmth to your desk.
                    </p>
                    <Button variant="primary" onClick={closeCart} className="mt-4">
                      Explore Collection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Free shipping banner */}
                    <div className="bg-sage/20 border border-sage/40 rounded-lg p-3 text-xs text-brand-green-dark flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
                      <span>
                        <strong>Free Shipping Activated!</strong> Inspected and packed with care in Pune.
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
              </>
            )}

            {/* STEP 2: CHECKOUT FORM */}
            {checkoutStep === "checkout" && (
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="bg-brand-green/5 border border-brand-green/20 rounded-lg p-3 text-xs text-charcoal/80">
                  <p className="font-semibold text-brand-green">Handmade in Kashmir Valley</p>
                  <p>Orders are dispatched directly via Express Courier with trackable shipment details.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/70 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 text-sm bg-white border border-warmgrey rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/70 mb-1">
                      Phone Number (for Courier & Updates) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 text-sm bg-white border border-warmgrey rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/70 mb-1">
                      Delivery Address & Pincode *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Flat/House, Street, City, State, Pincode"
                      className="w-full px-3 py-2 text-sm bg-white border border-warmgrey rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/70 mb-2">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          paymentChoice === "qr"
                            ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold"
                            : "border-warmgrey bg-white text-charcoal/70"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentChoice === "qr"}
                          onChange={() => setPaymentChoice("qr")}
                          className="sr-only"
                        />
                        <QrCode className="w-5 h-5 text-brand-green" />
                        <span className="text-xs">Google Pay / UPI</span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          paymentChoice === "cod"
                            ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold"
                            : "border-warmgrey bg-white text-charcoal/70"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentChoice === "cod"}
                          onChange={() => setPaymentChoice("cod")}
                          className="sr-only"
                        />
                        <Banknote className="w-5 h-5 text-brand-brown" />
                        <span className="text-xs">Cash on Delivery</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" className="w-full py-3">
                    {paymentChoice === "qr" ? "Proceed to Scan QR" : "Confirm COD Order"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("cart")}
                    className="w-full text-center text-xs text-charcoal/60 mt-3 hover:underline"
                  >
                    ← Back to Cart
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: QR CODE PAYMENT */}
            {checkoutStep === "qr_modal" && (
              <div className="text-center space-y-4 py-2">
                <div className="bg-white p-4 rounded-2xl border border-warmgrey shadow-md inline-block mx-auto">
                  <div className="w-48 h-48 mx-auto bg-brand-cream-dark rounded-xl flex flex-col items-center justify-center p-3 border-2 border-dashed border-brand-green/40">
                    {/* Visual QR presentation */}
                    <QrCode className="w-24 h-24 text-brand-green mb-2" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/70">
                      Scan via Google Pay / Paytm / PhonePe
                    </span>
                  </div>
                  <p className="font-display text-xl font-bold text-brand-green mt-3">
                    Pay {formatPrice(total)}
                  </p>
                  <p className="text-xs text-charcoal/60">UPI ID: dridhacrafts@upi</p>
                </div>

                <div className="bg-brand-gold/15 border border-brand-gold/40 p-3 rounded-xl text-left text-xs text-charcoal/80 space-y-1">
                  <p className="font-semibold text-brand-brown">Instant Order Booking:</p>
                  <p>1. Open Google Pay, PhonePe, or BHIM.</p>
                  <p>2. Scan code or send ₹{total} to UPI ID.</p>
                  <p>3. Tap "I Have Paid" below to record your order confirmation.</p>
                </div>

                <Button
                  variant="gold"
                  className="w-full py-3"
                  onClick={() => {
                    clearCart();
                    setCheckoutStep("cod_success");
                  }}
                >
                  I Have Completed Payment
                </Button>
              </div>
            )}

            {/* STEP 4: ORDER SUCCESS */}
            {checkoutStep === "cod_success" && (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto border-2 border-brand-green">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-brand-green">
                  Order Successfully Placed!
                </h3>
                <p className="text-sm text-charcoal/70 leading-relaxed">
                  Thank you, <strong>{customerName || "Friend"}</strong>. Your order is registered in our workshop.
                  We are preparing your handcrafted walnut pieces with utmost care.
                </p>
                <div className="bg-white border border-warmgrey rounded-xl p-4 text-xs text-left space-y-1">
                  <p className="text-charcoal/60">
                    Delivery to: <strong>{customerAddress}</strong>
                  </p>
                  <p className="text-charcoal/60">
                    Contact: <strong>{customerPhone}</strong>
                  </p>
                  <p className="text-charcoal/60">
                    Payment: <strong>{paymentChoice === "qr" ? "Google Pay (Verified)" : "Cash On Delivery"}</strong>
                  </p>
                </div>
                <p className="font-accent text-brand-gold text-lg">
                  Handmade in the Kashmir Valley • Crafted just for you.
                </p>
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => {
                    closeCart();
                    setCheckoutStep("cart");
                  }}
                >
                  Continue Exploring
                </Button>
              </div>
            )}
          </div>

          {/* Footer Subtotal & Action */}
          {checkoutStep === "cart" && items.length > 0 && (
            <div className="p-6 border-t border-warmgrey/70 bg-white/70 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-charcoal/60">Subtotal</span>
                <span className="font-semibold text-charcoal">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-charcoal/60">Express Shipping (Pan-India)</span>
                <span className="font-semibold text-sage">FREE</span>
              </div>
              <div className="border-t border-warmgrey/50 pt-2 flex justify-between items-center">
                <span className="font-display text-lg font-bold text-charcoal">Estimated Total</span>
                <span className="font-display text-2xl font-bold text-brand-green">{formatPrice(total)}</span>
              </div>
              <Button
                variant="primary"
                className="w-full py-4 text-base"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setCheckoutStep("checkout")}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
