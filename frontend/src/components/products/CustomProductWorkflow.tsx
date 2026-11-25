"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, ShoppingBag, Check, Sparkles, AlertCircle, RefreshCw, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { StaticProduct } from "@/lib/products-data";
import { useAuthGatedAddToCart } from "@/hooks/useAuthGatedAddToCart";
import { useAuthStore } from "@/stores/authStore";

interface CustomInquiryData {
  id: string;
  product_slug: string;
  product_name: string;
  custom_title?: string | null;
  requested_dimensions?: string | null;
  approved_dimensions?: string | null;
  approved_price?: number | null;
  status: "pending_chat" | "approved" | "in_cart" | "ordered" | "rejected";
  created_at: string;
}

interface CustomProductWorkflowProps {
  product: StaticProduct;
  isStandaloneCustom?: boolean;
  onAddToCartSuccess?: () => void;
}

export function CustomProductWorkflow({
  product,
  isStandaloneCustom = false,
  onAddToCartSuccess,
}: CustomProductWorkflowProps) {
  const { user } = useAuthStore();
  const { addToCart } = useAuthGatedAddToCart();

  const [inquiry, setInquiry] = useState<CustomInquiryData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Form fields for approved cart addition
  const [customTitle, setCustomTitle] = useState("");
  const [customSpecs, setCustomSpecs] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const storageKey = `dridha_custom_inquiry_${product.slug}`;

  // Check stored inquiry ID or fetch my active inquiry on mount
  const checkInquiryStatus = useCallback(async (inquiryId?: string) => {
    const idToCheck = inquiryId || inquiry?.id || (typeof window !== "undefined" ? localStorage.getItem(storageKey) : null);
    if (!idToCheck) return;

    try {
      setIsCheckingStatus(true);
      const res = await api.get<CustomInquiryData>(`/api/custom-inquiries/${idToCheck}`);
      if (res && res.id) {
        setInquiry(res);
        if (res.approved_dimensions && !customSpecs) {
          setCustomSpecs(res.approved_dimensions);
        }
        if (res.custom_title && !customTitle) {
          setCustomTitle(res.custom_title);
        }
      }
    } catch {
      // Inquiry might be expired or not found
    } finally {
      setIsCheckingStatus(false);
    }
  }, [inquiry?.id, storageKey, customSpecs, customTitle]);

  useEffect(() => {
    const storedId = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (storedId) {
      checkInquiryStatus(storedId);
    }
  }, [checkInquiryStatus, storageKey]);

  // Periodic polling for status update if an inquiry is pending_chat
  useEffect(() => {
    if (!inquiry || inquiry.status !== "pending_chat") return;
    const interval = setInterval(() => {
      checkInquiryStatus(inquiry.id);
    }, 8000);
    return () => clearInterval(interval);
  }, [inquiry, checkInquiryStatus]);

  // Handle WhatsApp chat confirmation
  const handleConfirmWhatsAppChat = async () => {
    setIsInitiatingChat(true);
    setErrorMsg(null);

    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919767807889";
    const defaultMsg = `Hello Dridha Crafts! I would like to inquire about customizing "${product.name}".

*Product:* ${product.name}
*Reference Slug:* ${product.slug}
*Customer:* ${user?.full_name || "Guest Customer"}
${user?.phone ? `*Phone:* ${user.phone}` : ""}

I want to discuss dimensions, device slots, and finalized pricing for my setup.`;

    try {
      // 1. Log custom inquiry in database
      const res = await api.post<CustomInquiryData>("/api/custom-inquiries", {
        product_slug: product.slug,
        product_name: product.name,
        customer_name: user?.full_name || undefined,
        customer_phone: user?.phone || undefined,
        customer_email: user?.email || undefined,
        whatsapp_message: defaultMsg,
      });

      if (res && res.id) {
        setInquiry(res);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, res.id);
        }
      }
    } catch (err) {
      console.warn("Could not log custom inquiry to backend, proceeding with direct WhatsApp chat:", err);
    } finally {
      setIsInitiatingChat(false);
      setShowConfirmModal(false);

      // 2. Open WhatsApp
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMsg)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Handle Add to Cart when approved
  const handleAddApprovedToCart = async () => {
    if (!inquiry || inquiry.status !== "approved") {
      setErrorMsg("Custom order is not approved yet. Please finalize specifications on WhatsApp first.");
      return;
    }

    if (isStandaloneCustom && !customTitle.trim()) {
      setErrorMsg("Please enter a custom name for your handcrafted piece.");
      return;
    }

    setIsAddingToCart(true);
    setErrorMsg(null);

    try {
      // 1. Lock item in backend
      const lockRes = await api.post<{
        success: boolean;
        price: number;
        custom_title: string;
        dimensions: string;
      }>(`/api/custom-inquiries/${inquiry.id}/lock-cart`, {
        custom_title: customTitle.trim() || product.name,
        final_dimensions: customSpecs.trim() || inquiry.approved_dimensions || "Tailored specifications",
      });

      const finalPrice = lockRes?.price ?? inquiry.approved_price ?? product.price;
      const finalTitle = lockRes?.custom_title || (customTitle.trim() ? customTitle.trim() : `${product.name} (Custom Edition)`);
      const finalDimensions = lockRes?.dimensions || customSpecs.trim() || inquiry.approved_dimensions || "Artisan Customization";

      // 2. Add to Cart with server-authoritative approved price
      const added = await addToCart({
        id: `custom-${inquiry.id}`,
        product_id: product.id,
        variant_id: null,
        custom_inquiry_id: inquiry.id,
        quantity: 1,
        product: {
          name: finalTitle,
          slug: product.slug,
          price: finalPrice,
          primary_image_url: product.images[0]?.url || "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/custom-caddy-1.png",
          stock_quantity: 10,
        },
        variant: {
          variant_name: finalDimensions,
          price_override: finalPrice,
        },
      });

      if (added) {
        setSuccessMsg(`"${finalTitle}" added to your cart with approved pricing (${formatPrice(finalPrice)})!`);
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
        // Reset state back to default
        setInquiry(null);
        setCustomTitle("");
        setCustomSpecs("");

        if (onAddToCartSuccess) {
          onAddToCartSuccess();
        }

        setTimeout(() => setSuccessMsg(null), 6000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to add custom piece to cart. Please check your connection.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const isApproved = inquiry?.status === "approved";
  const isPending = inquiry?.status === "pending_chat";

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-gold/40 p-5 sm:p-6 shadow-soft space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-warmgrey/60 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-gold shrink-0" />
          <h3 className="font-display text-lg font-bold text-brand-green">
            {isStandaloneCustom ? "Bespoke Artisan Commission" : "Request Custom Dimensions & Finishing"}
          </h3>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded-full">
          Artisan Handcrafted
        </span>
      </div>

      {/* Overview Description */}
      <p className="text-xs text-charcoal/75 leading-relaxed">
        {isStandaloneCustom
          ? "Every custom piece is hand-carved from fallen Kashmir pine based on workshop feasibility. Connect with our artisan on WhatsApp to finalize your exact workstation dimensions, slot apertures, or custom engraving. Once specifications and pricing are confirmed over chat, your order button unlocks here."
          : `Need this ${product.name} crafted in custom dimensions or tailored for specific devices? You can consult directly with our artisan over WhatsApp. Once terms and quotes are finalized over chat, you can add your custom edition directly to the cart.`}
      </p>

      {/* Status Notifications */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {isPending && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-900">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Chat Initiated • Awaiting Artisan Approval
            </span>
            <button
              onClick={() => checkInquiryStatus()}
              disabled={isCheckingStatus}
              className="text-[11px] underline flex items-center gap-1 text-amber-800 hover:text-amber-950 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? "animate-spin" : ""}`} />
              Check Status
            </button>
          </div>
          <p className="text-[11px] text-amber-800/80 leading-normal">
            Your inquiry reference is logged (Ref: #{inquiry?.id.slice(0, 8)}). Please finish finalizing dimensions and pricing on WhatsApp. As soon as the artisan approves it, the Add to Cart button below will automatically unlock!
          </p>
        </div>
      )}

      {isApproved && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3 text-xs text-emerald-950">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Artisan Approved Quote: {formatPrice(inquiry.approved_price || product.price)}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
              Unlocked
            </span>
          </div>
          {inquiry.approved_dimensions && (
            <p className="text-[11px] text-emerald-800 font-mono bg-white/70 p-2 rounded-lg border border-emerald-200">
              Specs: {inquiry.approved_dimensions}
            </p>
          )}

          {/* Form Fields for Custom Details */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-charcoal/80 mb-1">
                Name of Your Custom Product <span className="text-terracotta">*</span>
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Master Studio Pine Organizer"
                className="w-full px-3 py-2 text-xs border border-warmgrey rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-charcoal/80 mb-1">
                Finalized Specifications / Dimensions <span className="text-charcoal/40">(from WhatsApp chat)</span>
              </label>
              <input
                type="text"
                value={customSpecs}
                onChange={(e) => setCustomSpecs(e.target.value)}
                placeholder="e.g., 28 × 12 cm, slot for iPad Pro & iPhone, Rich Polish"
                className="w-full px-3 py-2 text-xs border border-warmgrey rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Two Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {/* Button 1: Chat for Customization */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setShowConfirmModal(true)}
          className="flex-1 py-3.5 border-emerald-600 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          Chat for Customization
        </Button>

        {/* Button 2: Add to Cart (Locked until approved) */}
        <Button
          type="button"
          variant={isApproved ? "gold" : "primary"}
          size="lg"
          onClick={handleAddApprovedToCart}
          disabled={!isApproved || isAddingToCart}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
            !isApproved ? "opacity-40 cursor-not-allowed bg-warmgrey/80 text-charcoal/50 border border-warmgrey" : ""
          }`}
        >
          {isAddingToCart ? (
            <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
          {isApproved ? "Add to Cart (Approved Quote)" : "Add to Cart (Locked)"}
        </Button>
      </div>

      {/* Step-by-Step Workflow Notes */}
      <div className="p-4 bg-brand-cream/80 border border-warmgrey/70 rounded-xl space-y-2 text-[11px] text-charcoal/70">
        <p className="font-bold text-brand-green text-xs uppercase tracking-wider">
          How the Customization Workflow Works:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="space-y-1">
            <span className="font-semibold text-brand-green block">1. Chat for Specifications</span>
            <p className="leading-tight text-charcoal/60">
              Click &apos;Chat for Customization&apos; to confirm and open WhatsApp. Discuss dimensions, finish, and pricing with the artisan.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-brand-green block">2. Artisan Approval</span>
            <p className="leading-tight text-charcoal/60">
              Once details are agreed over chat, the artisan approves the inquiry in the workshop system with the agreed quote.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-brand-green block">3. One-Time Add to Cart</span>
            <p className="leading-tight text-charcoal/60">
              The &apos;Add to Cart&apos; button unlocks with your approved quote. Enter your custom name and proceed to standard checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-brand-gold/30 shadow-elevated space-y-4 relative">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-warmgrey/40 text-charcoal/60"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-brand-green">
                  Initiate WhatsApp Chat?
                </h4>
                <p className="text-xs text-charcoal/60">
                  Connect directly with the Dridha Crafts artisan workshop
                </p>
              </div>
            </div>

            <p className="text-xs text-charcoal/80 leading-relaxed">
              You will be redirected to WhatsApp to finalize custom dimensions, hardware slots, and pricing for <strong>{product.name}</strong>.
            </p>

            <div className="p-3 bg-brand-cream rounded-xl border border-warmgrey/60 text-[11px] text-charcoal/70 italic">
              &quot;Hello Dridha Crafts! I would like to inquire about customizing {product.name}...&quot;
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="gold"
                size="md"
                onClick={handleConfirmWhatsAppChat}
                disabled={isInitiatingChat}
                className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isInitiatingChat ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Yes, Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
