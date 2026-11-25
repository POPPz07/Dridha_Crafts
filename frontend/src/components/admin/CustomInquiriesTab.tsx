"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Edit2,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface CustomInquiryItem {
  id: string;
  user_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  product_slug: string;
  product_name: string;
  custom_title?: string | null;
  requested_dimensions?: string | null;
  approved_dimensions?: string | null;
  requested_details?: string | null;
  approved_price?: number | null;
  artisan_notes?: string | null;
  status: "pending_chat" | "approved" | "in_cart" | "ordered" | "rejected";
  whatsapp_message?: string | null;
  created_at: string;
  updated_at: string;
}

export function CustomInquiriesTab() {
  const [inquiries, setInquiries] = useState<CustomInquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Approval modal state
  const [selectedInquiry, setSelectedInquiry] = useState<CustomInquiryItem | null>(null);
  const [approvalPrice, setApprovalPrice] = useState<string>("");
  const [approvalDimensions, setApprovalDimensions] = useState<string>("");
  const [artisanNotes, setArtisanNotes] = useState<string>("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reject modal state
  const [rejectInquiry, setRejectInquiry] = useState<CustomInquiryItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const fetchInquiries = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const url = statusFilter === "all"
        ? "/api/custom-inquiries/admin/all?limit=100"
        : `/api/custom-inquiries/admin/all?status_filter=${statusFilter}&limit=100`;
      const res = await api.get<CustomInquiryItem[]>(url);
      if (Array.isArray(res)) {
        setInquiries(res);
      }
    } catch (err) {
      console.error("Failed to fetch custom inquiries:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Open approval modal
  const handleOpenApproveModal = (inq: CustomInquiryItem) => {
    setSelectedInquiry(inq);
    setApprovalPrice(inq.approved_price ? String(inq.approved_price) : "");
    setApprovalDimensions(inq.approved_dimensions || inq.requested_dimensions || "");
    setArtisanNotes(inq.artisan_notes || "");
    setModalError(null);
  };

  // Submit approval
  const handleConfirmApproval = async () => {
    if (!selectedInquiry) return;
    const priceNum = parseFloat(approvalPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setModalError("Please enter a valid approved price greater than 0.");
      return;
    }

    setIsSubmittingApproval(true);
    setModalError(null);

    try {
      const res = await api.patch<CustomInquiryItem>(
        `/api/custom-inquiries/admin/${selectedInquiry.id}/approve`,
        {
          approved_price: priceNum,
          approved_dimensions: approvalDimensions.trim() || undefined,
          artisan_notes: artisanNotes.trim() || undefined,
        }
      );
      if (res && res.id) {
        setInquiries((prev) => prev.map((item) => (item.id === res.id ? res : item)));
        setSelectedInquiry(null);
      }
    } catch (err: any) {
      setModalError(err?.message || "Failed to approve inquiry.");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Submit rejection
  const handleConfirmReject = async () => {
    if (!rejectInquiry) return;
    setIsSubmittingReject(true);

    try {
      const res = await api.patch<CustomInquiryItem>(
        `/api/custom-inquiries/admin/${rejectInquiry.id}/reject`,
        {
          reason: rejectReason.trim() || "Workshop capacity or specifications not feasible",
        }
      );
      if (res && res.id) {
        setInquiries((prev) => prev.map((item) => (item.id === res.id ? res : item)));
        setRejectInquiry(null);
        setRejectReason("");
      }
    } catch (err) {
      console.error("Failed to reject inquiry:", err);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Filtered list
  const filtered = inquiries.filter((inq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inq.customer_name?.toLowerCase().includes(q) ||
      inq.customer_email?.toLowerCase().includes(q) ||
      inq.customer_phone?.includes(q) ||
      inq.product_name.toLowerCase().includes(q) ||
      inq.custom_title?.toLowerCase().includes(q) ||
      inq.id.toLowerCase().includes(q)
    );
  });

  const pendingCount = inquiries.filter((i) => i.status === "pending_chat").length;
  const approvedCount = inquiries.filter((i) => i.status === "approved").length;
  const orderedCount = inquiries.filter((i) => i.status === "ordered").length;

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-warmgrey shadow-soft">
          <div className="flex items-center justify-between text-charcoal/60 text-xs font-semibold uppercase">
            <span>Total Inquiries</span>
            <Sparkles className="w-4 h-4 text-brand-gold" />
          </div>
          <p className="text-2xl font-display font-bold text-brand-green mt-2">
            {inquiries.length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-300 shadow-soft bg-amber-50/30">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold uppercase">
            <span>Pending Discussion</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-display font-bold text-amber-900 mt-2">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-soft bg-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold uppercase">
            <span>Approved Quotes</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-display font-bold text-emerald-900 mt-2">
            {approvedCount}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-green/30 shadow-soft bg-brand-green/5">
          <div className="flex items-center justify-between text-brand-green text-xs font-semibold uppercase">
            <span>Converted to Orders</span>
            <ShoppingBag className="w-4 h-4 text-brand-green" />
          </div>
          <p className="text-2xl font-display font-bold text-brand-green mt-2">
            {orderedCount}
          </p>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-warmgrey shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Inquiries" },
            { id: "pending_chat", label: `Pending (${pendingCount})` },
            { id: "approved", label: `Approved (${approvedCount})` },
            { id: "in_cart", label: "In Cart" },
            { id: "ordered", label: `Ordered (${orderedCount})` },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? "bg-brand-green text-white shadow-sm"
                  : "bg-brand-cream text-charcoal/70 hover:bg-warmgrey/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, product..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-warmgrey rounded-xl bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </div>
          <button
            onClick={fetchInquiries}
            disabled={isRefreshing}
            className="p-2 border border-warmgrey rounded-xl text-charcoal/70 hover:text-brand-green hover:border-brand-green transition-colors"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Inquiry Cards List ── */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-warmgrey flex flex-col items-center justify-center gap-3 text-charcoal/50">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-gold" />
          <span className="text-xs uppercase font-semibold tracking-wider">Loading Custom Inquiries…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-warmgrey text-center space-y-2">
          <Sparkles className="w-8 h-8 text-brand-gold mx-auto" />
          <h4 className="font-display font-bold text-charcoal text-base">No Inquiries Found</h4>
          <p className="text-xs text-charcoal/60">
            {searchQuery ? "No inquiries matching your search criteria." : "No custom requests in this category yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inq) => {
            const isApproved = inq.status === "approved";
            const isPending = inq.status === "pending_chat";
            const isOrdered = inq.status === "ordered";
            const isInCart = inq.status === "in_cart";

            return (
              <div
                key={inq.id}
                className="bg-white rounded-2xl border border-warmgrey/80 p-5 shadow-soft hover:shadow-elevated transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warmgrey/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-charcoal/50 font-bold">
                      #{inq.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-charcoal/40">•</span>
                    <span className="text-xs text-charcoal/60 font-medium">
                      {new Date(inq.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Chat & Pricing
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Approved: {formatPrice(inq.approved_price || 0)}
                      </span>
                    )}
                    {isInCart && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                        Added to Cart
                      </span>
                    )}
                    {isOrdered && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                        Converted to Order
                      </span>
                    )}
                    {inq.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        Rejected / Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Customer Information */}
                  <div className="space-y-1">
                    <p className="font-semibold text-charcoal/50 uppercase tracking-wider text-[10px]">
                      Customer Details
                    </p>
                    <p className="font-bold text-charcoal text-sm">
                      {inq.customer_name || "Guest Customer"}
                    </p>
                    {inq.customer_phone && (
                      <p className="text-charcoal/70 flex items-center gap-1">
                        Phone: <strong className="text-charcoal">{inq.customer_phone}</strong>
                      </p>
                    )}
                    {inq.customer_email && (
                      <p className="text-charcoal/70">
                        Email: <strong className="text-charcoal">{inq.customer_email}</strong>
                      </p>
                    )}
                  </div>

                  {/* Product & Specifications */}
                  <div className="space-y-1">
                    <p className="font-semibold text-charcoal/50 uppercase tracking-wider text-[10px]">
                      Base Product & Custom Specs
                    </p>
                    <p className="font-bold text-brand-green text-sm">
                      {inq.product_name}
                    </p>
                    {inq.custom_title && (
                      <p className="text-charcoal/80">
                        Custom Title: <em>&quot;{inq.custom_title}&quot;</em>
                      </p>
                    )}
                    <p className="text-charcoal/70 font-mono bg-brand-cream/60 p-2 rounded-lg border border-warmgrey/50">
                      {inq.approved_dimensions || inq.requested_dimensions || "Standard Kashmir Pine Dimensions"}
                    </p>
                  </div>

                  {/* Workshop Notes / Quotes */}
                  <div className="space-y-1">
                    <p className="font-semibold text-charcoal/50 uppercase tracking-wider text-[10px]">
                      Artisan Workshop Notes
                    </p>
                    {inq.artisan_notes ? (
                      <p className="text-charcoal/80 italic bg-warmgrey/30 p-2 rounded-lg">
                        {inq.artisan_notes}
                      </p>
                    ) : (
                      <p className="text-charcoal/40 italic">No internal workshop notes added yet.</p>
                    )}
                    {inq.approved_price && (
                      <p className="pt-1 text-brand-green font-bold text-sm">
                        Approved Price: {formatPrice(inq.approved_price)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-warmgrey/40">
                  <div className="flex items-center gap-2">
                    {inq.customer_phone && (
                      <a
                        href={`https://wa.me/${inq.customer_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hello ${inq.customer_name || ""}! Regarding your Dridha Crafts custom inquiry for ${inq.product_name}:`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-xs font-semibold transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Chat on WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve Button */}
                    {inq.status !== "ordered" && inq.status !== "rejected" && (
                      <Button
                        type="button"
                        variant={isApproved ? "outline" : "gold"}
                        size="sm"
                        onClick={() => handleOpenApproveModal(inq)}
                        className="text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {isApproved ? "Update Approved Quote" : "Approve & Unlock Cart"}
                      </Button>
                    )}

                    {/* Reject Button */}
                    {inq.status === "pending_chat" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectInquiry(inq)}
                        className="text-xs text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Approval Modal ── */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-brand-gold/30 shadow-elevated space-y-4 relative">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-warmgrey/40 text-charcoal/60"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-green">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-brand-green">
                  Approve Custom Inquiry
                </h4>
                <p className="text-xs text-charcoal/60">
                  {selectedInquiry.product_name} • Ref: #{selectedInquiry.id.slice(0, 8)}
                </p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Approved Price (₹) <span className="text-terracotta">*</span>
                </label>
                <input
                  type="number"
                  value={approvalPrice}
                  onChange={(e) => setApprovalPrice(e.target.value)}
                  placeholder="e.g. 1199"
                  className="w-full px-3 py-2 text-sm border border-warmgrey rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold font-bold text-brand-green"
                />
                <span className="text-[10px] text-charcoal/50 block mt-1">
                  This exact price will be strictly locked in the cart and verified on checkout.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Approved Dimensions / Technical Specs
                </label>
                <input
                  type="text"
                  value={approvalDimensions}
                  onChange={(e) => setApprovalDimensions(e.target.value)}
                  placeholder="e.g. 26 × 10 cm, dual slot, custom phone cutouts"
                  className="w-full px-3 py-2 text-xs border border-warmgrey rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Artisan / Workshop Internal Notes
                </label>
                <textarea
                  rows={3}
                  value={artisanNotes}
                  onChange={(e) => setArtisanNotes(e.target.value)}
                  placeholder="Internal workshop instructions or WhatsApp discussion summary..."
                  className="w-full px-3 py-2 text-xs border border-warmgrey rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedInquiry(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmApproval}
                disabled={isSubmittingApproval}
                className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {isSubmittingApproval ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Confirm &amp; Unlock Cart
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-red-200 shadow-elevated space-y-4 relative">
            <button
              onClick={() => setRejectInquiry(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-warmgrey/40 text-charcoal/60"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-700">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-charcoal">
                  Reject Custom Inquiry
                </h4>
                <p className="text-xs text-charcoal/60">
                  Ref: #{rejectInquiry.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-charcoal">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Dimensions exceed fallen pine log diameter or hardware unfeasible..."
                className="w-full px-3 py-2 text-xs border border-warmgrey rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setRejectInquiry(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleConfirmReject}
                disabled={isSubmittingReject}
                className="flex-1 text-xs font-semibold text-red-600 border-red-300 hover:bg-red-50"
              >
                {isSubmittingReject ? "Closing…" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
