"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, ChevronRight, Truck, Shield, Loader2, MapPin, Plus, Home, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Address } from "@/types/user";
// import { getCashfree, CashfreeCheckoutResponse } from "@/lib/cashfree"; // Dormant - re-enable when Cashfree is active
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { formatPrice } from "@/lib/utils";

const addressSchema = z.object({
  full_name: z.string().min(2, "Name too short").max(100),
  phone: z.string().min(10, "Enter a valid 10-digit mobile number (required for delivery coordination)").max(15),
  address_line_1: z.string().min(5, "Enter full address"),
  address_line_2: z.string().optional(),
  city: z.string().min(2, "Enter city"),
  state: z.string().min(2, "Enter state"),
  pincode: z.string().length(6, "Enter valid 6-digit PIN code").regex(/^\d+$/, "Only digits"),
});

type AddressForm = z.infer<typeof addressSchema>;

type PaymentMethod = "whatsapp_upi";
type CheckoutStep = "address" | "payment" | "confirmation";

export default function CheckoutPage() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [step, setStep] = useState<CheckoutStep>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("dridha_checkout_step");
        if (saved === "payment" || saved === "address") return saved as CheckoutStep;
      } catch {}
    }
    return "address";
  });

  const updateStep = (newStep: CheckoutStep) => {
    setStep(newStep);
    try {
      if (typeof window !== "undefined") {
        if (newStep === "confirmation") {
          sessionStorage.removeItem("dridha_checkout_step");
        } else {
          sessionStorage.setItem("dridha_checkout_step", newStep);
        }
      }
    } catch {}
  };

  useEffect(() => {
    setHasHydrated(true);
  }, []);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [waUrl, setWaUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey] = useState<string>(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  });

  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const totalItems = useCartStore((s) => s.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);

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
  const totalAmount = subtotal + deliveryCharges;

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isUsingNewAddress, setIsUsingNewAddress] = useState(false);

  // 1. Fetch user's saved addresses
  useEffect(() => {
    if (!user) {
      setIsUsingNewAddress(true);
      return;
    }
    let isMounted = true;
    setIsLoadingAddresses(true);
    api.get<Address[]>("/api/addresses")
      .then((data) => {
        if (!isMounted) return;
        const addrs = data || [];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
          setSelectedAddressId(defaultAddr.id);
          setIsUsingNewAddress(false);
          reset({
            full_name: defaultAddr.full_name,
            phone: defaultAddr.phone,
            address_line_1: defaultAddr.address_line_1,
            address_line_2: defaultAddr.address_line_2 || "",
            city: defaultAddr.city,
            state: defaultAddr.state,
            pincode: defaultAddr.pincode,
          });
        } else {
          setIsUsingNewAddress(true);
          setSelectedAddressId(null);
        }
      })
      .catch(() => {
        if (isMounted) setIsUsingNewAddress(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingAddresses(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user, reset]);

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setIsUsingNewAddress(false);
    reset({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
  };

  const handleStartNewAddress = () => {
    setSelectedAddressId(null);
    setIsUsingNewAddress(true);
    reset({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  // 2. Auto-fill from cached local draft if no saved addresses are available
  useEffect(() => {
    if (savedAddresses.length > 0) return;
    try {
      const savedDraft = typeof window !== "undefined" ? localStorage.getItem("dridha_checkout_address") : null;
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === "object") {
          reset(parsed);
          return;
        }
      }
    } catch {
      // ignore JSON parse errors
    }

    if (user) {
      if (user.full_name) setValue("full_name", user.full_name);
      if (user.phone) setValue("phone", user.phone);
    }
  }, [user, reset, setValue, savedAddresses.length]);

  // 2. Persist filled fields to localStorage so refreshing never loses entered data
  useEffect(() => {
    const subscription = watch((values) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("dridha_checkout_address", JSON.stringify(values));
        }
      } catch {
        // ignore localStorage quota/disabled errors
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // 0. Initial Hydration & Auth Check Guard
  if (!hasHydrated || isAuthLoading) {
    return (
      <main className="min-h-screen bg-brand-cream flex items-center justify-center pt-28">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
          <p className="text-xs uppercase tracking-wider font-semibold text-charcoal/50">
            Preparing your checkout…
          </p>
        </div>
      </main>
    );
  }

  // 1. Auth Guard: Require an authenticated Supabase user before checkout
  if (!user && step !== "confirmation") {
    return (
      <main className="min-h-screen bg-brand-cream flex items-center justify-center p-4 pt-28 pb-16">
        <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft p-8 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-green">Sign in to Checkout</h1>
            <p className="text-charcoal/70 text-sm mt-1">
              Please sign in to your Dridha Crafts account to ensure secure order processing and tracking.
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => openAuthModal("login")}
            >
              Sign In / Register
            </Button>
            <Link href="/shop" className="block text-sm text-charcoal/60 hover:text-brand-green transition-colors">
              ← Return to Collection
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. Empty Cart Guard
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

  const onAddressSubmit = () => {
    updateStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    setIsWakingServer(false);
    setErrorMessage(null);

    // Warm-up timeout indicator for Render cold start
    const wakeTimer = setTimeout(() => {
      setIsWakingServer(true);
    }, 2500);

    const addressData = getValues();
    const cleanPhone = addressData.phone.replace(/[^\d]/g, "").slice(-10);
    const shippingAddressPayload = {
      full_name: addressData.full_name.trim(),
      phone: cleanPhone || addressData.phone.trim(),
      address_line_1: addressData.address_line_1.trim(),
      address_line_2: addressData.address_line_2?.trim() || null,
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      pincode: addressData.pincode.trim(),
    };

    const itemsPayload = items.map((i) => {
      const isValidUuid =
        i.variant_id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(i.variant_id);
      return {
        product_id: i.product_id,
        variant_id: isValidUuid ? i.variant_id : null,
        variant_name: i.variant?.variant_name || null,
        quantity: i.quantity,
      };
    });

    try {
      const orderPayload = {
        address_id: selectedAddressId && !isUsingNewAddress ? selectedAddressId : undefined,
        shipping_address: isUsingNewAddress || !selectedAddressId ? shippingAddressPayload : undefined,
        payment_method: "whatsapp_upi",
        idempotency_key: idempotencyKey,
        customer_email: user?.email || undefined,
        customer_phone: cleanPhone || addressData.phone,
        items: itemsPayload,
      };

      let orderNum = `DC-${Date.now().toString().slice(-6)}`;
      try {
        const res = await api.post<{ order_number: string; id: string }>("/api/orders", orderPayload);
        if (res && res.order_number) {
          orderNum = res.order_number;
          setOrderNumber(res.order_number);
          setOrderId(res.id);
        }
      } catch (apiErr) {
        console.warn("Backend order sync notice (proceeding via direct WhatsApp order):", apiErr);
        setOrderNumber(orderNum);
      }

      // Build WhatsApp message
      const itemsText = items
        .map((i) => `  • ${i.product.name}${i.variant?.variant_name ? ` (${i.variant.variant_name})` : ""} × ${i.quantity} — ₹${((i.variant?.price_override ?? i.product.price) * i.quantity).toFixed(0)}`)
        .join("\n");
      const addr = addressData;
      const waMessage =
        `Namaste Dridha Crafts! 🌲\nI'd like to complete my order:\n\n• Order Number: #${orderNum}\n${itemsText}\n• Subtotal: ₹${subtotal.toFixed(0)}\n• Delivery Charges: ₹${deliveryCharges.toFixed(0)}\n• Total: ₹${totalAmount.toFixed(0)}\n• Name: ${addr.full_name}\n• Phone: ${addr.phone}\n• Address: ${addr.address_line_1}${addr.address_line_2 ? ", " + addr.address_line_2 : ""}, ${addr.city}, ${addr.state} - ${addr.pincode}\n\nPlease share your GPay/PhonePe QR code so I can complete payment! 🙏`;

      const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919767807889";
      const generatedWaUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

      setWaUrl(generatedWaUrl);
      clearCart();
      updateStep("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Open WhatsApp in new tab (slight delay so user sees confirmation first)
      setTimeout(() => {
        window.open(generatedWaUrl, "_blank");
      }, 800);
    } catch (err: unknown) {
      console.error("Order placement failed:", err);
      let detail = "Failed to place order. Please try again.";
      if (err instanceof ApiError && err.data && typeof (err.data as { detail?: string }).detail === "string") {
        detail = (err.data as { detail: string }).detail;
      } else if (err instanceof Error) {
        detail = err.message;
      }
      setErrorMessage(detail);
    } finally {
      clearTimeout(wakeTimer);
      setIsPlacing(false);
      setIsWakingServer(false);
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
                <div className="px-8 py-6 bg-brand-green flex items-center justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-white">Shipping Address</h1>
                    <p className="text-brand-cream/70 text-sm mt-1">Where should we deliver your order?</p>
                  </div>
                  {savedAddresses.length > 0 && !isUsingNewAddress && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleStartNewAddress}
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add New Address
                    </Button>
                  )}
                </div>

                {isLoadingAddresses ? (
                  <div className="py-16 text-center space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin text-brand-green mx-auto" />
                    <p className="text-xs text-charcoal/60">Checking saved addresses...</p>
                  </div>
                ) : savedAddresses.length > 0 && !isUsingNewAddress ? (
                  /* Saved Addresses Choice View */
                  <form onSubmit={handleSubmit(onAddressSubmit)} className="px-8 py-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-green">
                        Choose Delivery Location
                      </p>
                      <span className="text-[11px] text-charcoal/50">
                        {savedAddresses.length} saved address{savedAddresses.length > 1 ? "es" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                              isSelected
                                ? "border-brand-green bg-brand-green/[0.03] shadow-xs"
                                : "border-warmgrey/80 bg-white hover:border-brand-green/40"
                            }`}
                          >
                            <div className="pt-0.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "border-brand-green bg-brand-green"
                                    : "border-warmgrey bg-white"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-sm text-brand-green flex items-center gap-1.5">
                                  <Home className="w-3.5 h-3.5 text-brand-gold" />
                                  {addr.full_name}
                                </span>
                                {addr.is_default && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase tracking-wider">
                                    <Star className="w-2.5 h-2.5 fill-brand-green" /> Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-charcoal/60">Phone: +91 {addr.phone}</p>
                              <p className="text-xs text-charcoal/80 leading-relaxed pt-0.5">
                                {addr.address_line_1}
                                {addr.address_line_2 ? `, ${addr.address_line_2}` : ""}, {addr.city},{" "}
                                {addr.state} — {addr.pincode}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleStartNewAddress}
                      className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-warmgrey hover:border-brand-green/60 text-xs font-semibold text-brand-green hover:bg-brand-cream/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Deliver to a New Address
                    </button>

                    <div className="pt-3 border-t border-warmgrey/60 flex items-center justify-between">
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-brand-green transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> Continue Shopping
                      </Link>
                      <Button type="submit" variant="primary" size="lg">
                        Deliver to this Address →
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Form View for New / Custom Address */
                  <form onSubmit={handleSubmit(onAddressSubmit)} className="px-8 py-6 space-y-5">
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const def = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
                          if (def) handleSelectAddress(def);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:underline mb-1"
                      >
                        ← Choose from saved addresses
                      </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        label="Full Name"
                        id="full_name"
                        autoComplete="name"
                        error={errors.full_name?.message}
                        {...register("full_name")}
                      />
                      <FormField
                        label="Phone Number"
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        error={errors.phone?.message}
                        {...register("phone")}
                      />
                    </div>
                    <FormField
                      label="Address Line 1"
                      id="address_line_1"
                      autoComplete="street-address"
                      error={errors.address_line_1?.message}
                      {...register("address_line_1")}
                      placeholder="House no., Street, Locality"
                    />
                    <FormField
                      label="Address Line 2 (Optional)"
                      id="address_line_2"
                      autoComplete="address-line2"
                      error={errors.address_line_2?.message}
                      {...register("address_line_2")}
                      placeholder="Landmark, Apartment, etc."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        label="City"
                        id="city"
                        autoComplete="address-level2"
                        error={errors.city?.message}
                        {...register("city")}
                      />
                      <FormField
                        label="State"
                        id="state"
                        autoComplete="address-level1"
                        error={errors.state?.message}
                        {...register("state")}
                      />
                      <FormField
                        label="PIN Code"
                        id="pincode"
                        autoComplete="postal-code"
                        error={errors.pincode?.message}
                        {...register("pincode")}
                        placeholder="6 digits"
                        maxLength={6}
                      />
                    </div>

                    <div className="p-3 bg-brand-cream/80 border border-warmgrey/70 rounded-xl flex items-center gap-2 text-xs text-charcoal/70">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>This address will be automatically saved to your account profile for future orders.</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-brand-green transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> Continue Shopping
                      </Link>
                      <Button type="submit" variant="primary" size="lg">
                        Continue to Payment
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === "payment" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft overflow-hidden">
                  <div className="px-8 py-6 bg-brand-green">
                    <h2 className="font-display text-2xl font-bold text-white">Payment Method</h2>
                    <p className="text-brand-cream/70 text-sm mt-1">Safe & personal checkout via WhatsApp</p>
                  </div>
                  <div className="px-8 py-6">
                    {/* WhatsApp UPI Card */}
                    <div className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-brand-green bg-brand-green/5 text-left">
                      {/* WhatsApp SVG icon */}
                      <div className="shrink-0 mt-0.5">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-brand-green text-lg">Pay via WhatsApp &amp; UPI</span>
                        </div>
                        <p className="text-sm text-charcoal/70 mb-3">
                          Place your order → We&apos;ll redirect you to WhatsApp → Share our GPay/PhonePe QR → Done!
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-charcoal/70 bg-warmgrey/50 px-2.5 py-0.5 rounded-full">
                            🔒 Safe &amp; Personal
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-charcoal/70 bg-warmgrey/50 px-2.5 py-0.5 rounded-full">
                            ⏱ 48-hr Confirmation Window
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-charcoal/70 bg-warmgrey/50 px-2.5 py-0.5 rounded-full">
                            📸 Screenshot Proof
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security notice */}
                <div className="flex items-center gap-3 px-4 py-3 bg-sage/10 border border-sage/20 rounded-xl">
                  <Shield className="w-5 h-5 text-brand-green shrink-0" />
                  <p className="text-xs text-charcoal/70">Your order and personal information are secure. We never store payment details.</p>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta rounded-xl text-sm font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="flex flex-col items-end gap-2 pt-2">
                  <div className="flex items-center justify-between w-full">
                    <button onClick={() => updateStep("address")} className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-brand-green transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Back to Address
                    </button>
                    <Button variant="primary" size="lg" onClick={handlePlaceOrder} isLoading={isPlacing}>
                      {isPlacing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Placing Order...
                        </>
                      ) : (
                        "Place Order & Open WhatsApp →"
                      )}
                    </Button>
                  </div>
                  {isWakingServer && (
                    <p className="text-xs text-brand-green/80 animate-pulse text-right">
                      Connecting to secure order server... Please wait a few moments ✨
                    </p>
                  )}
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
                  <h1 className="font-display text-4xl font-bold text-brand-green mb-2">Order #{orderNumber} Placed! 🎉</h1>
                  <p className="text-charcoal/70">WhatsApp is opening automatically. If it didn&apos;t open, tap the button below.</p>
                </div>

                {/* Open WhatsApp button */}
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#25D366] text-white font-semibold shadow-md hover:bg-[#1ebe5d] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Open WhatsApp to Pay
                  </a>
                )}

                <div className="bg-white rounded-2xl border border-warmgrey p-6 text-left max-w-sm mx-auto shadow-soft">
                  <p className="text-sm text-charcoal/70 mb-2 font-semibold">What&apos;s next?</p>
                  <ul className="space-y-2 text-sm text-charcoal/70">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-green shrink-0" /> Order pending payment confirmation via WhatsApp</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-green shrink-0" /> Carefully packaged for safe transit</li>
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
                      <p className="text-sm font-bold text-brand-green shrink-0">{formatPrice((item.variant?.price_override ?? item.product.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-5 space-y-3 border-t border-warmgrey/60 bg-warmgrey/10">
                  <div className="flex justify-between text-sm text-charcoal/70">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-charcoal/70">
                    <span>Delivery Charges</span>
                    <span className="font-semibold text-charcoal">{formatPrice(deliveryCharges)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-brand-green border-t border-warmgrey/60 pt-3 text-base">
                    <span className="font-display text-lg">Total</span>
                    <span className="font-display text-xl">{formatPrice(totalAmount)}</span>
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
