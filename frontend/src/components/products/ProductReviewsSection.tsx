"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Video,
  X,
  Loader2,
  Sparkles,
  Lock,
  PackageCheck,
  ChevronRight,
  Filter,
  Maximize2,
  Play,
} from "lucide-react";
import { api } from "@/lib/api";
import { compressImage, formatFileSize } from "@/lib/mediaUtils";
import { useAuthStore } from "@/stores/authStore";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReviewItem {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  images: string[];
  video_url?: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface ReviewStats {
  items: ReviewItem[];
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
}

export interface ReviewEligibility {
  can_review: boolean;
  reason: "eligible" | "already_reviewed" | "not_delivered" | "not_purchased" | "not_authenticated";
  product_name: string;
  order_id?: string | null;
  existing_review?: ReviewItem | null;
}

interface ProductReviewsSectionProps {
  productSlug: string;
  productName: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor — Needs Improvement",
  2: "Fair — Acceptable",
  3: "Good — Meets Expectations",
  4: "Very Good — Highly Recommended",
  5: "Exceptional — Handcrafted Perfection",
};

export function ProductReviewsSection({ productSlug, productName }: ProductReviewsSectionProps) {
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const [reviewsData, setReviewsData] = useState<ReviewStats>({
    items: [],
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  });
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRating, setFilterRating] = useState<number | "all" | "photos">("all");
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // ─── Fetch Reviews & Eligibility ──────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [revRes, eligRes] = await Promise.all([
        api.get<ReviewStats>(`/api/products/${productSlug}/reviews`),
        api.get<ReviewEligibility>(`/api/products/${productSlug}/review-eligibility`).catch(() => null),
      ]);
      if (revRes) setReviewsData(revRes);
      if (eligRes) setEligibility(eligRes);
    } catch {
      // Graceful fallback on network glitch
    } finally {
      setIsLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    loadData();
  }, [loadData, user]);

  // ─── Filtered Reviews ─────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (filterRating === "photos") {
      return reviewsData.items.filter((r) => r.images && r.images.length > 0);
    }
    if (typeof filterRating === "number") {
      return reviewsData.items.filter((r) => r.rating === filterRating);
    }
    return reviewsData.items;
  }, [reviewsData.items, filterRating]);

  const photosCount = useMemo(
    () => reviewsData.items.filter((r) => r.images && r.images.length > 0).length,
    [reviewsData.items]
  );

  return (
    <section className="py-16 border-t border-warmgrey/60">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-warmgrey/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-[11px] font-semibold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
              100% Verified Collector Feedback
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-green">
              Customer Reviews
            </h2>
            <p className="text-xs sm:text-sm text-charcoal/70 mt-1 max-w-xl">
              Authentic stories, desk setups, and real craftsmanship impressions from verified owners.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-warmgrey/70 shadow-xs self-start md:self-auto">
            <div className="text-right">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(reviewsData.average_rating || 5)
                        ? "fill-brand-gold text-brand-gold"
                        : "text-warmgrey fill-warmgrey"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-charcoal/60 mt-0.5">
                {reviewsData.total_reviews > 0
                  ? `${reviewsData.average_rating} out of 5 stars`
                  : "Awaiting first review"}
              </p>
            </div>
            <div className="h-8 w-px bg-warmgrey/60" />
            <div className="text-center px-1">
              <span className="font-display text-2xl font-bold text-brand-green">
                {reviewsData.total_reviews}
              </span>
              <p className="text-[10px] text-charcoal/50 uppercase tracking-widest font-semibold">
                {reviewsData.total_reviews === 1 ? "Review" : "Reviews"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Summary & Write Review Card Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Star Breakdown Bars */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-warmgrey/70 shadow-soft space-y-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold text-brand-green">
                Rating Breakdown
              </h3>
              <span className="text-xs text-charcoal/50 font-medium">
                Based on {reviewsData.total_reviews} verified purchases
              </span>
            </div>

            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsData.rating_distribution[String(stars)] || 0;
                const pct =
                  reviewsData.total_reviews > 0
                    ? Math.round((count / reviewsData.total_reviews) * 100)
                    : 0;

                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() =>
                      setFilterRating(filterRating === stars ? "all" : stars)
                    }
                    className={`w-full group flex items-center gap-3 text-xs text-charcoal/80 p-1.5 -mx-1.5 rounded-lg transition-colors ${
                      filterRating === stars ? "bg-brand-cream font-bold" : "hover:bg-brand-cream/60"
                    }`}
                  >
                    <span className="w-12 text-left font-semibold flex items-center gap-1">
                      {stars} <Star className="w-3 h-3 fill-brand-gold text-brand-gold inline" />
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-warmgrey/30 overflow-hidden relative">
                      <div
                        className="h-full bg-brand-gold rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-charcoal/50 group-hover:text-charcoal text-[11px] font-mono">
                      {count} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Filters */}
            <div className="pt-4 border-t border-warmgrey/50 flex flex-wrap items-center gap-2">
              <span className="text-xs text-charcoal/50 font-medium flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setFilterRating("all")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filterRating === "all"
                    ? "bg-brand-green text-white shadow-xs"
                    : "bg-brand-cream text-charcoal/70 hover:bg-warmgrey/30"
                }`}
              >
                All ({reviewsData.total_reviews})
              </button>
              {photosCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterRating("photos")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    filterRating === "photos"
                      ? "bg-brand-green text-white shadow-xs"
                      : "bg-brand-cream text-charcoal/70 hover:bg-warmgrey/30"
                  }`}
                >
                  <Camera className="w-3 h-3" /> With Photos ({photosCount})
                </button>
              )}
            </div>
          </div>

          {/* Right: Eligibility & Review Action Box */}
          <div className="lg:col-span-5 bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#E5DFD5] shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green">
                <ShieldCheck className="w-5 h-5 text-brand-green" />
              </div>
              <div>
                <h4 className="font-semibold text-brand-green text-sm">
                  Verified Buyer Policy
                </h4>
                <p className="text-[11px] text-charcoal/60">
                  Only buyers who have received their piece can leave a review.
                </p>
              </div>
            </div>

            {/* Eligibility State Handling */}
            {isLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-charcoal/50">
                <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
                Checking review eligibility…
              </div>
            ) : eligibility?.can_review ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Purchase Verified!</span> Your order has been delivered. Share your honest thoughts, photos, and desk setup below.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-brand-green text-white font-semibold text-sm shadow-md hover:bg-brand-green/90 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-brand-gold group-hover:rotate-12 transition-transform" />
                  Write a Verified Review
                </button>
              </div>
            ) : eligibility?.reason === "already_reviewed" ? (
              <div className="p-4 bg-white rounded-2xl border border-warmgrey/70 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-brand-green font-bold">
                  <CheckCircle2 className="w-4 h-4 text-brand-green" />
                  You reviewed this piece
                </div>
                <p className="text-charcoal/70 leading-relaxed">
                  Thank you for taking the time to share your feedback and supporting our artisans.
                </p>
              </div>
            ) : eligibility?.reason === "not_delivered" ? (
              <div className="p-4 bg-white rounded-2xl border border-warmgrey/70 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-brand-brown font-bold">
                  <PackageCheck className="w-4 h-4 text-brand-brown" />
                  Order In Progress
                </div>
                <p className="text-charcoal/70 leading-relaxed">
                  We found your order! As soon as your shipment is marked as <strong>Delivered</strong>, your review form will automatically unlock here.
                </p>
              </div>
            ) : eligibility?.reason === "not_authenticated" ? (
              <div className="p-4 bg-white rounded-2xl border border-warmgrey/70 text-xs space-y-3">
                <p className="text-charcoal/70 leading-relaxed">
                  Already purchased this piece? Sign in with the account you used during checkout to unlock review privileges.
                </p>
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-green text-white font-semibold text-xs hover:bg-brand-green/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Sign In to Review
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-white/70 rounded-2xl border border-warmgrey/60 text-xs space-y-2 text-charcoal/60">
                <div className="flex items-center gap-1.5 font-semibold text-charcoal/70">
                  <Lock className="w-3.5 h-3.5 text-brand-gold" />
                  Locked for Non-Purchasers
                </div>
                <p className="leading-relaxed">
                  To eliminate spam and fake ratings, reviews are exclusively unlocked for verified owners of this handcrafted item.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews Feed ──────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-brand-green">
              {filterRating === "all"
                ? `All Verified Reviews (${reviewsData.total_reviews})`
                : filterRating === "photos"
                ? `Reviews with Photos (${filteredItems.length})`
                : `${filterRating}-Star Reviews (${filteredItems.length})`}
            </h3>
            {filterRating !== "all" && (
              <button
                type="button"
                onClick={() => setFilterRating("all")}
                className="text-xs text-brand-brown hover:text-brand-green underline font-medium"
              >
                Clear filter
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-warmgrey/70 space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center mx-auto text-brand-gold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-display text-lg font-bold text-brand-green">
                No reviews found
              </h4>
              <p className="text-xs text-charcoal/60 max-w-md mx-auto leading-relaxed">
                {filterRating !== "all"
                  ? "No reviews match your selected filter. Try selecting 'All' above."
                  : "Be the first verified customer to share your thoughts, photos, and desk transformation for this handcrafted piece!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-warmgrey/70 shadow-soft hover:shadow-medium transition-shadow space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Review Header: User & Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold text-xs flex items-center justify-center">
                          {review.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-charcoal">
                              {review.user_name}
                            </span>
                            {review.is_verified && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Verified Buyer
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-charcoal/50">
                            {new Date(review.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? "fill-brand-gold text-brand-gold"
                                : "text-warmgrey fill-warmgrey"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    {review.title && (
                      <h4 className="font-semibold text-sm text-brand-green leading-snug">
                        {review.title}
                      </h4>
                    )}

                    {/* Comment */}
                    <p className="text-xs text-charcoal/80 leading-relaxed whitespace-pre-line">
                      {review.comment}
                    </p>
                  </div>

                  {/* Attached Media (Photos & Video) */}
                  {(review.images.length > 0 || review.video_url) && (
                    <div className="pt-3 border-t border-warmgrey/40 space-y-3">
                      {/* Photo Thumbnails */}
                      {review.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveLightboxImg(imgUrl)}
                              className="relative w-16 h-16 rounded-xl overflow-hidden border border-warmgrey/60 group cursor-pointer"
                            >
                              <Image
                                src={imgUrl}
                                alt={`Customer review photo ${idx + 1}`}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                sizes="64px"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-4 h-4 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Video Player */}
                      {review.video_url && (
                        <div className="rounded-2xl overflow-hidden border border-warmgrey/60 bg-black max-w-sm">
                          <video
                            src={review.video_url}
                            controls
                            controlsList="nodownload noplaybackrate"
                            disablePictureInPicture
                            onContextMenu={(e) => e.preventDefault()}
                            preload="metadata"
                            className="w-full max-h-48 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox Modal ─────────────────────────────────────────────────── */}
      {activeLightboxImg && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveLightboxImg(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full h-full max-h-[80vh] flex items-center justify-center">
              <Image
                src={activeLightboxImg}
                alt="Enlarged review photo"
                fill
                className="object-contain rounded-2xl"
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Write Review Modal ────────────────────────────────────────────── */}
      {isModalOpen && (
        <WriteReviewModal
          productSlug={productSlug}
          productName={productName}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadData();
          }}
        />
      )}
    </section>
  );
}

// ─── Write Review Modal Sub-Component ────────────────────────────────────────

interface WriteReviewModalProps {
  productSlug: string;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function WriteReviewModal({ productSlug, productName, onClose, onSuccess }: WriteReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const activeRating = hoverRating ?? rating;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);

    if (images.length + incoming.length > 4) {
      setErrorMsg("You can attach a maximum of 4 photos.");
      return;
    }

    setErrorMsg("");
    // Compress each photo client-side before queuing
    const compressed: File[] = [];
    for (const f of incoming) {
      if (!f.type.startsWith("image/")) continue;
      const comp = await compressImage(f, 1600, 0.85);
      compressed.push(comp);
    }
    setImages((prev) => [...prev, ...compressed].slice(0, 4));
    e.target.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const maxBytes = 15 * 1024 * 1024; // 15 MB cap

    if (file.size > maxBytes) {
      setErrorMsg("Video exceeds the maximum size limit of 15 MB. Please select a shorter clip.");
      e.target.value = "";
      return;
    }

    setErrorMsg("");
    setVideo(file);
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 5) {
      setErrorMsg("Please write at least a few words (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setUploadStatus("Uploading media...");

    try {
      // 1. Upload photos (if any)
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setUploadStatus(`Uploading photo ${i + 1} of ${images.length}…`);
        const fd = new FormData();
        fd.append("file", images[i]);
        const res = await api.upload<{ url: string }>("/api/reviews/upload", fd);
        if (res?.url) uploadedImageUrls.push(res.url);
      }

      // 2. Upload video (if any)
      let uploadedVideoUrl: string | null = null;
      if (video) {
        setUploadStatus("Uploading video clip…");
        const fd = new FormData();
        fd.append("file", video);
        const res = await api.upload<{ url: string }>("/api/reviews/upload", fd);
        if (res?.url) uploadedVideoUrl = res.url;
      }

      // 3. Submit review
      setUploadStatus("Publishing verified review…");
      await api.post(`/api/products/${productSlug}/reviews`, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: uploadedImageUrls,
        video_url: uploadedVideoUrl || undefined,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-elevated border border-warmgrey/70 relative my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full text-charcoal/50 hover:bg-warmgrey/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified Customer Review
          </div>
          <h3 className="font-display text-2xl font-bold text-brand-green">
            Review {productName}
          </h3>
          <p className="text-xs text-charcoal/60">
            Share your honest thoughts, finish quality, and photos with the artisan community.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-2">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1.5 -m-1.5 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= activeRating
                        ? "fill-brand-gold text-brand-gold drop-shadow-xs"
                        : "text-warmgrey fill-warmgrey"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-semibold text-brand-green ml-3">
                {RATING_LABELS[activeRating]}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 mb-1.5">
              Review Headline (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stunning grain texture and solid ergonomic angle"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgrey/70 bg-brand-cream/30 text-xs text-charcoal focus:outline-none focus:border-brand-green transition-colors"
            />
          </div>

          {/* Comment Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-charcoal/80">
                Detailed Review <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-charcoal/50 font-mono">
                {comment.length}/2000
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the build quality, wood aroma, ergonomics, and how it pairs with your workspace..."
              maxLength={2000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgrey/70 bg-brand-cream/30 text-xs text-charcoal focus:outline-none focus:border-brand-green transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Media Attachments Section */}
          <div className="space-y-3 pt-2 border-t border-warmgrey/50">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-charcoal/80 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-brand-gold" />
                  Add Customer Photos ({images.length}/4)
                </span>
                <span className="text-[10px] text-charcoal/50">
                  Compressed to WebP automatically
                </span>
              </div>

              {/* Photo Preview Grid */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-warmgrey/70 group"
                  >
                    <Image
                      src={URL.createObjectURL(img)}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 font-mono truncate px-1">
                      {formatFileSize(img.size)}
                    </div>
                  </div>
                ))}

                {images.length < 4 && (
                  <label className="border-2 border-dashed border-warmgrey/80 rounded-xl aspect-square flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:border-brand-green hover:bg-brand-cream/40 transition-colors">
                    <Camera className="w-5 h-5 text-charcoal/40 mb-1" />
                    <span className="text-[10px] text-charcoal/60 font-medium">Add Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Video Attachment (Optional) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-charcoal/80 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-brand-gold" />
                  Add Short Video (Optional, max 15 MB)
                </span>
              </div>

              {video ? (
                <div className="flex items-center justify-between p-2.5 bg-brand-cream rounded-xl border border-warmgrey/70 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Play className="w-4 h-4 text-brand-green shrink-0" />
                    <span className="truncate font-medium">{video.name}</span>
                    <span className="text-[10px] text-charcoal/50 font-mono shrink-0">
                      ({formatFileSize(video.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideo(null)}
                    className="p-1 hover:bg-warmgrey/40 rounded-full text-charcoal/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-warmgrey/80 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer hover:border-brand-green hover:bg-brand-cream/40 transition-colors text-xs text-charcoal/60">
                  <Video className="w-4 h-4 text-charcoal/50" />
                  <span>Select Video Clip (MP4, WEBM, MOV)</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Upload Status / Progress */}
          {uploadStatus && (
            <div className="flex items-center gap-2 p-2.5 bg-brand-cream rounded-xl text-xs text-brand-green font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-warmgrey/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-charcoal/70 hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl bg-brand-green text-white font-semibold text-xs shadow-soft hover:bg-brand-green/90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Publish Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
