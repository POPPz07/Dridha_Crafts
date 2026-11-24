"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  LogOut,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Save,
  Loader2,
  RefreshCw,
  HelpCircle,
  Printer,
} from "lucide-react";
import CustomerInvoiceModal from "@/components/orders/CustomerInvoiceModal";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { Order, OrderListItem, OrderStatus } from "@/types/order";
import type { User } from "@/types/user";

const CURRENT_STATUSES: OrderStatus[] = [
  "payment_verification",
  "pending",
  "payment_pending",
  "confirmed",
  "processing",
  "shipped",
];

const PAST_STATUSES: OrderStatus[] = ["delivered", "cancelled", "refunded"];

function getStatusBadge(status: string) {
  switch (status) {
    case "payment_verification":
      return {
        label: "Verification Needed",
        subtext: "Waiting for WhatsApp payment slip",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <Clock className="w-3.5 h-3.5 text-amber-700" />,
      };
    case "confirmed":
      return {
        label: "Confirmed",
        subtext: "Payment received & order booked",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
      };
    case "processing":
      return {
        label: "Crafting in Srinagar",
        subtext: "Master artisans preparing your items",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Sparkles className="w-3.5 h-3.5 text-blue-700" />,
      };
    case "shipped":
      return {
        label: "Dispatched",
        subtext: "In transit via pan-India courier",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Truck className="w-3.5 h-3.5 text-purple-700" />,
      };
    case "delivered":
      return {
        label: "Delivered",
        subtext: "Safely arrived at destination",
        color: "bg-emerald-50 text-emerald-900 border-emerald-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        subtext: "Order was cancelled",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: <AlertCircle className="w-3.5 h-3.5 text-gray-600" />,
      };
    case "refunded":
      return {
        label: "Refunded",
        subtext: "Amount returned to original account",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: <AlertCircle className="w-3.5 h-3.5 text-gray-600" />,
      };
    default:
      return {
        label: status.replace("_", " "),
        subtext: "",
        color: "bg-warmgrey/60 text-charcoal border-warmgrey",
        icon: <Clock className="w-3.5 h-3.5" />,
      };
  }
}

function OrderTrackingTimeline({ order }: { order: Order }) {
  const steps = [
    {
      id: "confirmed",
      label: "Confirmed",
      desc: "Order verified",
      isComplete: ["confirmed", "processing", "shipped", "delivered"].includes(order.status),
      isCurrent: order.status === "confirmed",
    },
    {
      id: "processing",
      label: "Artisan Crafting",
      desc: "Handcrafted in Kashmir",
      isComplete: ["processing", "shipped", "delivered"].includes(order.status),
      isCurrent: order.status === "processing",
    },
    {
      id: "shipped",
      label: "In Transit",
      desc: order.carrier ? `Via ${order.carrier}` : "Courier dispatched",
      isComplete: ["shipped", "delivered"].includes(order.status),
      isCurrent: order.status === "shipped",
    },
    {
      id: "delivered",
      label: "Delivered",
      desc: order.delivered_at
        ? new Date(order.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "At destination",
      isComplete: order.status === "delivered",
      isCurrent: order.status === "delivered",
    },
  ];

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-warmgrey/80 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal/70 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-brand-green" /> Delivery Status &amp; Live Tracking
        </h4>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20 uppercase tracking-wider">
          {order.status.replace("_", " ")}
        </span>
      </div>

      {/* Stepped Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {steps.map((s, idx) => (
          <div key={s.id} className="relative flex flex-col items-center text-center p-2.5 rounded-xl bg-brand-cream/60 border border-warmgrey/40">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                s.isComplete
                  ? "bg-brand-green text-white shadow-sm"
                  : s.isCurrent
                  ? "bg-brand-gold text-white animate-pulse"
                  : "bg-warmgrey/50 text-charcoal/40"
              }`}
            >
              {s.isComplete ? "✓" : idx + 1}
            </div>
            <span className={`text-xs font-bold ${s.isComplete || s.isCurrent ? "text-brand-green" : "text-charcoal/40"}`}>
              {s.label}
            </span>
            <span className="text-[10px] text-charcoal/50 leading-tight mt-0.5">
              {s.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Live Tracking Information Card */}
      {(order.tracking_number || order.carrier || order.tracking_status_note) && (
        <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 space-y-2.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                Courier &amp; AWB Consignment
              </span>
              <p className="font-semibold text-purple-900 text-sm mt-0.5">
                {order.carrier || "Courier Partner"}:{" "}
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-purple-200">
                  {order.tracking_number || "Dispatched"}
                </span>
              </p>
            </div>
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
              >
                Track on {order.carrier || "Carrier"} Site ↗
              </a>
            )}
          </div>

          {order.tracking_status_note && (
            <div className="bg-white/90 p-2.5 rounded-lg border border-purple-100 flex items-start gap-2 text-purple-950">
              <span className="text-sm">📍</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                  Live Dispatch Update
                </p>
                <p className="text-xs font-medium text-purple-900 mt-0.5">
                  {order.tracking_status_note}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const clearCart = useCartStore((s) => s.clearCart);

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Orders State
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState<"current" | "past" | "all">("current");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<Order | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<Order | null>(null);

  // Sync profile fields from user
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // Fetch customer orders
  const fetchOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const res = await api.get<{ items: OrderListItem[]; total: number }>("/api/orders?per_page=50");
      setOrders(res?.items || []);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Gentle auto-polling (every 30s) so live updates from admin reflect automatically
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get<{ items: OrderListItem[]; total: number }>("/api/orders?per_page=50");
        if (res?.items) {
          setOrders(res.items);
          if (expandedOrderId) {
            const updated = await api.get<Order>(`/api/orders/${expandedOrderId}`);
            setExpandedOrderDetails(updated);
          }
        }
      } catch {
        // silent fallback for polling
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, expandedOrderId]);

  // Load single order details on expansion
  const toggleOrderDetails = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setExpandedOrderDetails(null);
      return;
    }

    setExpandedOrderId(orderId);
    setIsLoadingDetails(true);
    try {
      const details = await api.get<Order>(`/api/orders/${orderId}`);
      setExpandedOrderDetails(details);
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    try {
      const updated = await api.put<User>("/api/auth/profile", {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });

      if (updated) {
        setUser(updated);
        setProfileSuccessMsg("Profile information updated successfully!");
        setTimeout(() => setProfileSuccessMsg(""), 3500);
      }
    } catch (err: any) {
      setProfileErrorMsg(err?.data?.detail || "Could not update profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      logout();
      clearCart();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
      logout();
      clearCart();
      router.push("/");
    }
  };

  // Split orders
  const currentOrders = useMemo(
    () => orders.filter((o) => CURRENT_STATUSES.includes(o.status)),
    [orders]
  );
  const pastOrders = useMemo(
    () => orders.filter((o) => PAST_STATUSES.includes(o.status)),
    [orders]
  );

  const displayedOrders =
    orderFilter === "current" ? currentOrders : orderFilter === "past" ? pastOrders : orders;

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Member";

  // Auth Guard
  if (!isAuthLoading && !user) {
    return (
      <main className="min-h-screen bg-brand-cream flex items-center justify-center p-4 pt-28 pb-16">
        <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft p-8 sm:p-10 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-green">
              Customer Account
            </h1>
            <p className="text-charcoal/70 text-sm mt-2 leading-relaxed">
              Sign in to your Dridha Crafts account to view your past and active orders, manage
              shipping details, and update your profile.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => openAuthModal("login")}
            >
              Sign In to Your Account
            </Button>
            <Link href="/shop" className="block text-sm text-charcoal/60 hover:text-brand-green">
              ← Browse Dridha Collection
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream pt-28 pb-20">
      <Container>
        {/* ── Top Header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-warmgrey/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-green text-white flex items-center justify-center font-display text-xl font-bold shadow-soft">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "D"}
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-green">
                  Namaste, {user?.full_name || "Friend"}
                </h1>
                <p className="text-xs sm:text-sm text-charcoal/60 mt-0.5">
                  {user?.email} • Patron since {formattedDate}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-terracotta hover:bg-terracotta/10 border border-terracotta/30"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
            <Link href="/shop">
              <Button variant="primary" size="sm" leftIcon={<ShoppingBag className="w-4 h-4" />}>
                Explore Shop
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
          {/* ── LEFT: Personal Details ──────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-warmgrey/80 shadow-soft overflow-hidden">
              <div className="px-6 py-5 bg-brand-green/5 border-b border-warmgrey/70">
                <h2 className="font-display text-lg font-bold text-brand-green flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-brand-gold" /> Personal Information
                </h2>
                <p className="text-xs text-charcoal/60 mt-0.5">
                  Update your contact details used for orders & deliveries
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                    ✓ {profileSuccessMsg}
                  </div>
                )}
                {profileErrorMsg && (
                  <div className="p-3 bg-terracotta/10 border border-terracotta/30 text-terracotta rounded-xl text-xs font-medium">
                    {profileErrorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="profile-name"
                    className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide"
                  >
                    Full Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-brand-cream border border-warmgrey rounded-xl text-sm text-charcoal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="profile-email"
                    className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="profile-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-4 py-2.5 bg-warmgrey/20 border border-warmgrey/60 rounded-xl text-sm text-charcoal/60 cursor-not-allowed outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="profile-phone"
                    className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide"
                  >
                    Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    name="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2.5 bg-brand-cream border border-warmgrey rounded-xl text-sm text-charcoal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingProfile}
                  className="w-full mt-2"
                  leftIcon={!isUpdatingProfile ? <Save className="w-4 h-4" /> : undefined}
                >
                  Save Changes
                </Button>
              </form>
            </div>

            {/* Dridha Concierge Card */}
            <div className="bg-brand-green/5 border border-brand-green/20 rounded-3xl p-6 text-charcoal/80 space-y-3">
              <div className="flex items-center gap-2 text-brand-green font-display font-bold text-base">
                <HelpCircle className="w-4 h-4 text-brand-gold" /> Need Assistance?
              </div>
              <p className="text-xs text-charcoal/70 leading-relaxed">
                Have custom pine engraving requests, delivery queries, or need care advice for
                your handcrafted wooden pieces? Our atelier is available on WhatsApp.
              </p>
              <a
                href="https://wa.me/919767807889?text=Namaste%20Dridha%20Crafts!%20I%20have%20a%20question%20regarding%20my%20order/account."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand-green hover:underline pt-1"
              >
                Chat with Workshop on WhatsApp →
              </a>
            </div>
          </div>

          {/* ── RIGHT: Orders Section ───────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl border border-warmgrey/80 shadow-soft overflow-hidden">
              {/* Order Navigation Tabs */}
              <div className="p-6 border-b border-warmgrey/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand-gold" /> Order History
                  </h2>
                  <p className="text-xs sm:text-sm text-charcoal/60 mt-0.5">
                    Track live handcrafted wooden creations and review past deliveries
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-warmgrey/30 p-1 rounded-2xl w-fit">
                    <button
                      onClick={() => setOrderFilter("current")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        orderFilter === "current"
                          ? "bg-brand-green text-white shadow-sm"
                          : "text-charcoal/70 hover:text-brand-green"
                      }`}
                    >
                      Active Orders ({currentOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderFilter("past")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        orderFilter === "past"
                          ? "bg-brand-green text-white shadow-sm"
                          : "text-charcoal/70 hover:text-brand-green"
                      }`}
                    >
                      Past Orders ({pastOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderFilter("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        orderFilter === "all"
                          ? "bg-brand-green text-white shadow-sm"
                          : "text-charcoal/70 hover:text-brand-green"
                      }`}
                    >
                      All ({orders.length})
                    </button>
                  </div>
                  <button
                    onClick={fetchOrders}
                    disabled={isLoadingOrders}
                    title="Refresh orders"
                    className="p-2 rounded-xl border border-warmgrey/80 bg-white text-charcoal/60 hover:text-brand-green hover:border-brand-green transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Orders List */}
              <div className="p-6">
                {isLoadingOrders ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto" />
                    <p className="text-sm font-medium text-brand-green">Loading your orders...</p>
                    <p className="text-xs text-charcoal/50">Retrieving from order vault. Please hold on a moment.</p>
                  </div>
                ) : displayedOrders.length === 0 ? (
                  <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                    <div className="w-16 h-16 rounded-full bg-warmgrey/30 flex items-center justify-center mx-auto text-charcoal/40">
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-charcoal">
                        {orderFilter === "current"
                          ? "No Active Orders"
                          : orderFilter === "past"
                          ? "No Past Orders"
                          : "No Orders Yet"}
                      </h3>
                      <p className="text-xs text-charcoal/60 mt-1 leading-relaxed">
                        {orderFilter === "current"
                          ? "You have no orders currently in preparation or transit. When you place an order, it will appear here."
                          : "Your completed orders and delivered items will be archived here."}
                      </p>
                    </div>
                    <Link href="/shop" className="inline-block pt-2">
                      <Button variant="primary" size="sm">
                        Explore Office Desk Collection
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedOrders.map((order) => {
                      const badge = getStatusBadge(order.status);
                      const isExpanded = expandedOrderId === order.id;

                      const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={order.id}
                          className="border border-warmgrey/80 rounded-2xl bg-white hover:border-brand-gold/60 transition-all shadow-sm overflow-hidden"
                        >
                          {/* Main Row */}
                          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-display font-bold text-base text-brand-green">
                                  #{order.order_number}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.color}`}
                                >
                                  {badge.icon} {badge.label}
                                </span>
                              </div>
                              <p className="text-xs text-charcoal/60">
                                Placed on {orderDate} • {order.item_count}{" "}
                                {order.item_count === 1 ? "item" : "items"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-warmgrey/40">
                              <div className="text-left sm:text-right">
                                <span className="text-xs text-charcoal/50 block">Order Total</span>
                                <span className="font-display text-lg font-bold text-brand-green">
                                  {formatPrice(order.total)}
                                </span>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => toggleOrderDetails(order.id)}
                                rightIcon={
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                      isExpanded ? "rotate-90" : ""
                                    }`}
                                  />
                                }
                              >
                                {isExpanded ? "Hide Details" : "View Details"}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Details Drawer */}
                          {isExpanded && (
                            <div className="border-t border-warmgrey/60 bg-warmgrey/10 p-5 sm:p-6 space-y-5 animate-fade-in">
                              {isLoadingDetails && !expandedOrderDetails ? (
                                <div className="py-6 text-center">
                                  <Loader2 className="w-5 h-5 animate-spin text-brand-green mx-auto" />
                                </div>
                              ) : expandedOrderDetails ? (
                                <>
                                  {/* WhatsApp Payment Alert (if pending verification) */}
                                  {expandedOrderDetails.status === "payment_verification" && (
                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                      <div>
                                        <p className="font-bold flex items-center gap-1.5">
                                          <Clock className="w-4 h-4 text-amber-700" /> Payment
                                          Confirmation Pending
                                        </p>
                                        <p className="text-amber-800 text-xs mt-0.5">
                                          Please send your UPI screenshot on WhatsApp to confirm
                                          your order and start crafting.
                                        </p>
                                      </div>
                                      <a
                                        href={`https://wa.me/919767807889?text=Namaste%20Dridha%20Crafts!%20Here%20is%20my%20payment%20proof%20for%20Order%20%23${expandedOrderDetails.order_number}.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#1ebe5d] transition-colors shrink-0"
                                      >
                                        Open WhatsApp to Pay →
                                      </a>
                                    </div>
                                  )}

                                  {/* Interactive Order Timeline & Live Tracking Card */}
                                  <OrderTrackingTimeline order={expandedOrderDetails} />

                                  {/* Line items list */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
                                      Ordered Items ({expandedOrderDetails.items?.length || 0})
                                    </p>
                                    <div className="divide-y divide-warmgrey/40 bg-white rounded-xl border border-warmgrey/60 overflow-hidden">
                                      {expandedOrderDetails.items?.map((item) => (
                                        <div
                                          key={item.id}
                                          className="p-3 sm:p-4 flex items-center justify-between gap-4"
                                        >
                                          <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative w-12 h-12 rounded-lg bg-warmgrey/20 overflow-hidden shrink-0">
                                              {item.image_url ? (
                                                <Image
                                                  src={item.image_url}
                                                  alt={item.product_name}
                                                  fill
                                                  className="object-cover"
                                                  sizes="48px"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center text-charcoal/30">
                                                  <Package className="w-5 h-5" />
                                                </div>
                                              )}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-sm font-semibold text-brand-green truncate">
                                                {item.product_name}
                                              </p>
                                              <p className="text-xs text-charcoal/60">
                                                Qty: {item.quantity} × {formatPrice(item.price)}
                                              </p>
                                            </div>
                                          </div>
                                          <span className="font-semibold text-sm text-charcoal shrink-0">
                                            {formatPrice(item.total)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Breakdown & Delivery address */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white p-4 rounded-xl border border-warmgrey/60 space-y-1">
                                      <p className="font-bold text-brand-green uppercase tracking-wide text-[10px] mb-1">
                                        Delivery Address
                                      </p>
                                      <p className="font-semibold text-charcoal">
                                        {expandedOrderDetails.shipping_name} (
                                        {expandedOrderDetails.shipping_phone})
                                      </p>
                                      <p className="text-charcoal/70 leading-relaxed">
                                        {[
                                          expandedOrderDetails.shipping_address_line_1,
                                          expandedOrderDetails.shipping_address_line_2,
                                          expandedOrderDetails.shipping_city,
                                          expandedOrderDetails.shipping_state,
                                          expandedOrderDetails.shipping_pincode,
                                        ]
                                          .filter(Boolean)
                                          .join(", ")}
                                      </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-warmgrey/60 space-y-1.5">
                                      <p className="font-bold text-brand-green uppercase tracking-wide text-[10px] mb-1">
                                        Order Breakdown
                                      </p>
                                      <div className="flex justify-between text-charcoal/70">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(expandedOrderDetails.subtotal)}</span>
                                      </div>
                                      <div className="flex justify-between text-charcoal/70">
                                        <span>Delivery Charges</span>
                                        <span>{formatPrice(expandedOrderDetails.shipping_cost)}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-brand-green border-t border-warmgrey/40 pt-1.5 text-sm">
                                        <span>Total</span>
                                        <span>{formatPrice(expandedOrderDetails.total)}</span>
                                      </div>
                                      <div className="pt-2">
                                        <button
                                          type="button"
                                          onClick={() => setInvoiceModalOrder(expandedOrderDetails)}
                                          className="w-full bg-stone-50 hover:bg-stone-100 text-charcoal border border-warmgrey/80 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                        >
                                          <Printer className="w-3.5 h-3.5 text-brand-green" />
                                          Download / Print Official Tax Invoice
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Invoice Modal */}
        <CustomerInvoiceModal
          isOpen={Boolean(invoiceModalOrder)}
          onClose={() => setInvoiceModalOrder(null)}
          order={invoiceModalOrder}
        />
      </Container>
    </main>
  );
}
