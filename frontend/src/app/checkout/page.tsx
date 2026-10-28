"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, ChevronRight, QrCode, Truck, Shield, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/utils";

const addressSchema = z.object({
  full_name: z.string().min(2, "Name too short").max(100),
  phone: z.string().min(10, "Enter a valid phone number").max(15),
  address_line_1: z.string().min(5, "Enter full address"),
  address_line_2: z.string().optional(),
  city: z.string().min(2, "Enter city"),
  state: z.string().min(2, "Enter state"),
  pincode: z.string().length(6, "Enter valid 6-digit PIN code").regex(/^\d+$/, "Only digits"),
});

type AddressForm = z.infer<typeof addressSchema>;

type PaymentMethod = "cod" | "gpay";
type CheckoutStep = "address" | "payment" | "confirmation";

export default function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>("address");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const totalItems = useCartStore((s) => s.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  if (items.length === 0 && step !== "confirmation") {
    return (
      <main className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-display text-2xl text-brand-green">Your cart is empty</p>
          <Link href="/shop">
            <Button variant="primary">Browse Collection</Button>
          </Link>
        </div>
      </main>
    );
  }

  const onAddressSubmit = (data: AddressForm) => {
    console.log("Address:", data);
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      // TODO: Connect to FastAPI backend when ready
      // For now, simulate order placement
      await new Promise((r) => setTimeout(r, 1500));
      const generatedOrderNum = `DC-${Date.now().toString().slice(-6)}`;
      setOrderNumber(generatedOrderNum);
      clearCart();
      setStep("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Order placement failed:", err);
    } finally {
      setIsPlacing(false);
    }
  };

  // ── Progress Steps ─────────────────────────────────────────
  const stepConfig = [
    { key: "address", label: "Address" },
    { key: "payment", label: "Payment" },
    { key: "confirmation", label: "Confirmed" },
  ];
  const currentStepIndex = stepConfig.findIndex((s) => s.key === step);

  return (
    <main className="min-h-screen bg-brand-cream pt-28 pb-16">
      <Container>
        {/* Progress Indicator */}
        {step !== "confirmation" && (
          <div className="flex items-center justify-center gap-0 mb-10 max-w-sm mx-auto">
            {stepConfig.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`flex items-center gap-2 ${i <= currentStepIndex ? "text-brand-green" : "text-charcoal/30"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < currentStepIndex
                      ? "bg-brand-green border-brand-green text-white"
                      : i === currentStepIndex
                      ? "bg-white border-brand-green text-brand-green"
                      : "bg-white border-warmgrey text-charcoal/30"
                  }`}>
                    {i < currentStepIndex ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < stepConfig.length - 1 && (
                  <ChevronRight className={`w-4 h-4 mx-2 ${i < currentStepIndex ? "text-brand-green" : "text-warmgrey"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── LEFT: Main Flow ────────────────────────────── */}
          <div className="lg:col-span-7">

            {/* STEP 1: Address */}
            {step === "address" && (
              <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft overflow-hidden">
                <div className="px-8 py-6 bg-brand-green">
                  <h1 className="font-display text-2xl font-bold text-white">Shipping Address</h1>
                  <p className="text-brand-cream/70 text-sm mt-1">Where should we deliver your order?</p>
                </div>
                <form onSubmit={handleSubmit(onAddressSubmit)} className="px-8 py-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Full Name" id="full_name" error={errors.full_name?.message} {...register("full_name")} />
                    <FormField label="Phone Number" id="phone" type="tel" error={errors.phone?.message} {...register("phone")} />
                  </div>
                  <FormField label="Address Line 1" id="address_line_1" error={errors.address_line_1?.message} {...register("address_line_1")} placeholder="House no., Street, Locality" />
                  <FormField label="Address Line 2 (Optional)" id="address_line_2" error={errors.address_line_2?.message} {...register("address_line_2")} placeholder="Landmark, Apartment, etc." />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="City" id="city" error={errors.city?.message} {...register("city")} />
                    <FormField label="State" id="state" error={errors.state?.message} {...register("state")} />
                    <FormField label="PIN Code" id="pincode" error={errors.pincode?.message} {...register("pincode")} placeholder="6 digits" maxLength={6} />
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-brand-green transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Continue Shopping
                    </Link>
                    <Button type="submit" variant="primary" size="lg">
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === "payment" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft overflow-hidden">
                  <div className="px-8 py-6 bg-brand-green">
                    <h2 className="font-display text-2xl font-bold text-white">Payment Method</h2>
                    <p className="text-brand-cream/70 text-sm mt-1">Choose how you'd like to pay</p>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    {/* COD Option */}
                    <button
                      onClick={() => setPaymentMethod("cod")}
                      className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                        paymentMethod === "cod"
                          ? "border-brand-green bg-brand-green/5"
                          : "border-warmgrey hover:border-brand-green/40"
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "cod" ? "border-brand-green" : "border-warmgrey"}`}>
                        {paymentMethod === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-brand-green" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Truck className="w-5 h-5 text-brand-green" />
                          <span className="font-semibold text-brand-green">Cash on Delivery (COD)</span>
                        </div>
                        <p className="text-xs text-charcoal/60 mt-1">Pay when your order arrives. No advance payment needed.</p>
                      </div>
                    </button>

                    {/* Google Pay QR */}
                    <button
                      onClick={() => setPaymentMethod("gpay")}
                      className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                        paymentMethod === "gpay"
                          ? "border-brand-green bg-brand-green/5"
                          : "border-warmgrey hover:border-brand-green/40"
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "gpay" ? "border-brand-green" : "border-warmgrey"}`}>
                        {paymentMethod === "gpay" && <div className="w-2.5 h-2.5 rounded-full bg-brand-green" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-brand-green" />
                          <span className="font-semibold text-brand-green">Google Pay / UPI (QR Code)</span>
                        </div>
                        <p className="text-xs text-charcoal/60 mt-1">Scan the QR code and complete payment. Order confirmed after verification.</p>
                      </div>
                    </button>

                    {/* GPay QR placeholder */}
                    {paymentMethod === "gpay" && (
                      <div className="bg-warmgrey/30 rounded-2xl p-6 text-center border border-warmgrey">
                        <QrCode className="w-20 h-20 text-brand-green/40 mx-auto mb-3" />
                        <p className="text-sm font-medium text-brand-green">Scan with Google Pay or any UPI app</p>
                        <p className="text-xs text-charcoal/50 mt-1">UPI ID: dridhacrafts@upi (placeholder — will be updated)</p>
                        <p className="text-xs text-charcoal/50 mt-1">Amount: {formatPrice(subtotal)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security notice */}
                <div className="flex items-center gap-3 px-4 py-3 bg-sage/10 border border-sage/20 rounded-xl">
                  <Shield className="w-5 h-5 text-brand-green shrink-0" />
                  <p className="text-xs text-charcoal/70">Your order and personal information are secure. We never store payment details.</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setStep("address")} className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-brand-green transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Address
                  </button>
                  <Button variant="primary" size="lg" onClick={handlePlaceOrder} isLoading={isPlacing}>
                    {isPlacing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Placing Order...</> : "Place Order"}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirmation */}
            {step === "confirmation" && (
              <div className="text-center py-12 space-y-6">
                {/* Success icon */}
                <div className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center mx-auto shadow-elevated">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold text-brand-green mb-2">Order Placed!</h1>
                  <p className="text-charcoal/70">Your order number is</p>
                  <p className="font-display text-2xl font-bold text-brand-brown mt-1">{orderNumber}</p>
                </div>
                <div className="bg-white rounded-2xl border border-warmgrey p-6 text-left max-w-sm mx-auto shadow-soft">
                  <p className="text-sm text-charcoal/70 mb-2 font-semibold">What's next?</p>
                  <ul className="space-y-2 text-sm text-charcoal/70">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-green shrink-0" /> Order confirmed and being prepared</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-green shrink-0" /> Packed in eco-friendly 5-ply box</li>
                    <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand-green shrink-0" /> Dispatched within 3–5 business days</li>
                  </ul>
                </div>
                <p className="font-accent text-brand-brown text-2xl">Crafted with care, just for you. ✨</p>
                <Link href="/shop">
                  <Button variant="primary" size="lg">Continue Shopping</Button>
                </Link>
              </div>
            )}
          </div>

          {/* ── RIGHT: Order Summary ────────────────────────── */}
          {step !== "confirmation" && (
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft overflow-hidden sticky top-24">
                <div className="px-6 py-5 border-b border-warmgrey/60">
                  <h2 className="font-display text-xl font-bold text-brand-green">
                    Order Summary ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </h2>
                </div>
                <div className="divide-y divide-warmgrey/40 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-6 py-4">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-warmgrey/20 shrink-0">
                        {item.product.primary_image_url && (
                          <Image src={item.product.primary_image_url} alt={item.product.name} fill className="object-cover" sizes="56px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-green truncate">{item.product.name}</p>
                        <p className="text-xs text-charcoal/50">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-brand-green shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-5 space-y-3 border-t border-warmgrey/60 bg-warmgrey/10">
                  <div className="flex justify-between text-sm text-charcoal/70">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-charcoal/70">
                    <span>Shipping</span>
                    <span className="text-brand-green font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between font-bold text-brand-green border-t border-warmgrey/60 pt-3 text-base">
                    <span className="font-display text-lg">Total</span>
                    <span className="font-display text-xl">{formatPrice(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}

// Reusable form field
function FormField({
  label, id, error, className, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-3 bg-brand-cream border rounded-xl text-sm text-charcoal outline-none transition-all focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 ${
          error ? "border-terracotta/60" : "border-warmgrey"
        } ${className || ""}`}
        {...props}
      />
      {error && <p className="text-xs text-terracotta">{error}</p>}
    </div>
  );
}
