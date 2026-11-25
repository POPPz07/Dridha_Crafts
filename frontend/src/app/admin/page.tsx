"use client";

import { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import {
  BarChart3,
  Package,
  Users,
  Boxes,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Truck,
  RefreshCw,
  Loader2,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  Edit3,
  Plus,
  Minus,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Shield,
  Search,
  Trash2,
  Clock,
  Hammer,
  Filter,
  ArrowRight,
  Printer,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import OrderPrintModal from "@/components/orders/OrderPrintModal";
import { CustomInquiriesTab } from "@/components/admin/CustomInquiriesTab";

// ─── Types ───────────────────────────────────────────────────────────────────

type AdminStats = {
  timeframe?: string;
  today_orders: number;
  today_revenue: number;
  cashfree_revenue?: number;
  whatsapp_revenue?: number;
  pending_verification: number;
  crafting_count?: number;
  ready_to_pack_count?: number;
  shipped_count?: number;
  delivered_count?: number;
  low_stock_products: { id: string; name: string; stock_quantity: number }[];
  all_time_orders: number;
  recent_orders?: {
    id: string;
    order_number: string;
    shipping_name: string;
    total: number;
    status: string;
    payment_method: string;
    created_at?: string;
    items_count: number;
  }[];
};

type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address_line_1: string;
  shipping_address_line_2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  tracking_number?: string;
  carrier?: string;
  tracking_url?: string;
  tracking_status_note?: string;
  delivered_at?: string;
  cancel_reason?: string;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
};

type AdminCustomer = {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role?: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  wishlist_count: number;
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  stock_quantity: number;
  price: number;
  is_active: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    payment_verification: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    pending: "bg-gray-100 text-gray-700",
    processing: "bg-indigo-100 text-indigo-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    payment_verification: "Needs Verification",
    confirmed: "Ready to Pack",
    processing: "Artisan Crafting",
    shipped: "In Transit / Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    pending: "Pending",
  };
  return map[status] ?? status;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-6 flex items-start gap-4 ${
        highlight ? "border-red-300 bg-red-50" : "border-warmgrey/70"
      }`}
    >
      <div
        className={`p-3 rounded-xl ${
          highlight ? "bg-red-100 text-red-600" : "bg-brand-green/10 text-brand-green"
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-charcoal/60 font-medium">{label}</p>
        <p
          className={`text-2xl font-bold mt-0.5 ${
            highlight ? "text-red-600" : "text-charcoal"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Error Boundary ─────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin section error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-charcoal">
            {this.props.fallbackTitle || "Error Loading This Section"}
          </h3>
          <p className="text-xs text-red-600 leading-relaxed">
            {this.state.error?.message || "An unexpected error occurred while rendering this tab."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 bg-brand-green text-white rounded-xl text-xs font-semibold hover:bg-brand-green/90 transition-colors shadow-xs"
          >
            Retry Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

type TabId = "pulse" | "orders" | "custom_inquiries" | "customers" | "inventory" | "traffic";
type OrderFilter =
  | "needs_verification"
  | "crafting"
  | "ready_to_pack"
  | "shipped"
  | "delivered"
  | "all";

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("pulse");
  const [ordersInitialFilter, setOrdersInitialFilter] = useState<OrderFilter>("needs_verification");

  const navigateToOrdersStage = (stage: OrderFilter) => {
    setOrdersInitialFilter(stage);
    setActiveTab("orders");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToInventory = () => {
    setActiveTab("inventory");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/admin");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-brand-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    return (
      <main className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-charcoal">
            Access Denied
          </h1>
          <p className="text-charcoal/60">
            This area is restricted to administrators only.
          </p>
        </div>
      </main>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "pulse", label: "Live Pulse", icon: TrendingUp },
    { id: "orders", label: "Orders Pipeline", icon: Package },
    { id: "custom_inquiries", label: "Custom Inquiries", icon: Sparkles },
    { id: "customers", label: "Customers", icon: Users },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "traffic", label: "Traffic & Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* ── Header ── */}
      <header className="bg-brand-green text-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="w-6 h-6 text-brand-gold" />
          <span className="font-display text-xl font-bold tracking-wide">
            Dridha Crafts Admin
          </span>
        </div>
        <span className="text-white/70 text-sm">
          Signed in as{" "}
          <strong className="text-brand-gold">{user?.email ?? "admin"}</strong>
        </span>
      </header>

      {/* ── Tab Navigation ── */}
      <nav className="bg-white border-b border-warmgrey sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex gap-0 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                  active
                    ? "border-brand-green text-brand-green"
                    : "border-transparent text-charcoal/60 hover:text-charcoal"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Tab Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <AdminErrorBoundary key={activeTab} fallbackTitle={`Error loading ${activeTab} tab`}>
          {activeTab === "pulse" && (
            <PulseTab
              onNavigateToOrders={navigateToOrdersStage}
              onNavigateToInventory={navigateToInventory}
              onNavigateToCustomInquiries={() => {
                setActiveTab("custom_inquiries");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
          {activeTab === "orders" && (
            <OrdersTab
              initialFilter={ordersInitialFilter}
              onFilterChange={setOrdersInitialFilter}
            />
          )}
          {activeTab === "custom_inquiries" && <CustomInquiriesTab />}
          {activeTab === "customers" && <CustomersTab />}
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "traffic" && <TrafficTab />}
        </AdminErrorBoundary>
      </main>
    </div>
  );
}

// ─── Auth Error Interceptor ──────────────────────────────────────────────────

function handleAdminAuthError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status: number }).status;
    if (status === 401 || status === 403) {
      useAuthStore.getState().logout();
      window.location.href = "/login?redirect=/admin";
      return true;
    }
  }
  return false;
}

// ─── Tab 1: Live Pulse ────────────────────────────────────────────────────────

function PulseTab({
  onNavigateToOrders,
  onNavigateToInventory,
  onNavigateToCustomInquiries,
}: {
  onNavigateToOrders: (stage: OrderFilter) => void;
  onNavigateToInventory: () => void;
  onNavigateToCustomInquiries?: () => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingCustomCount, setPendingCustomCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d" | "all">("today");
  const [quickSearch, setQuickSearch] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<AdminStats>(`/api/admin/stats?timeframe=${timeframe}`);
      setStats(data);
      try {
        const inqs = await api.get<any[]>("/api/custom-inquiries/admin/all?limit=50");
        if (Array.isArray(inqs)) {
          const count = inqs.filter((i) => i.status === "pending_chat" || i.status === "approved").length;
          setPendingCustomCount(count);
        }
      } catch {}
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const filteredRecentOrders =
    stats?.recent_orders?.filter((o) => {
      if (!quickSearch.trim()) return true;
      const term = quickSearch.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(term) ||
        o.shipping_name.toLowerCase().includes(term) ||
        o.status.toLowerCase().includes(term)
      );
    }) || [];

  return (
    <div className="space-y-8">
      {/* ── Top Header & Timeframe Selector ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Live Pulse
          </h2>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Real-time atelier telemetry, revenue diagnostics, and dispatch tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe pills */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-warmgrey/70 shadow-2xs">
            {(
              [
                { id: "today", label: "Today" },
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "all", label: "All Time" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeframe === t.id
                    ? "bg-brand-green text-white shadow-xs"
                    : "text-charcoal/60 hover:text-charcoal"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white border border-warmgrey/70 text-charcoal px-3 py-2 rounded-xl text-xs font-semibold hover:bg-brand-cream transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-medium">
          {error}
        </div>
      )}

      {loading && !stats && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
        </div>
      )}

      {stats && (
        <>
          {/* ── 4 Top Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl border border-warmgrey/70 shadow-2xs p-5 space-y-2">
              <div className="flex items-center justify-between text-charcoal/60 text-xs font-medium">
                <span>Revenue ({timeframe.toUpperCase()})</span>
                <TrendingUp className="w-4 h-4 text-brand-green" />
              </div>
              <p className="text-2xl font-bold text-charcoal">
                {formatPrice(stats.today_revenue)}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-charcoal/60">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                  CF: {formatPrice(stats.cashfree_revenue || 0)}
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                  WA: {formatPrice(stats.whatsapp_revenue || 0)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-warmgrey/70 shadow-2xs p-5 space-y-2">
              <div className="flex items-center justify-between text-charcoal/60 text-xs font-medium">
                <span>Orders ({timeframe.toUpperCase()})</span>
                <Package className="w-4 h-4 text-brand-gold" />
              </div>
              <p className="text-2xl font-bold text-charcoal">
                {stats.today_orders}
              </p>
              <p className="text-[11px] text-charcoal/50">
                All-time catalog orders: <strong>{stats.all_time_orders}</strong>
              </p>
            </div>

            <div
              onClick={() => onNavigateToOrders("needs_verification")}
              className={`rounded-2xl border shadow-2xs p-5 space-y-2 cursor-pointer transition-all hover:scale-[1.01] ${
                stats.pending_verification > 0
                  ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
                  : "bg-white border-warmgrey/70"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span
                  className={
                    stats.pending_verification > 0
                      ? "text-amber-800 font-bold"
                      : "text-charcoal/60"
                  }
                >
                  Awaiting Verification
                </span>
                <AlertTriangle
                  className={`w-4 h-4 ${
                    stats.pending_verification > 0
                      ? "text-amber-600"
                      : "text-charcoal/40"
                  }`}
                />
              </div>
              <p
                className={`text-2xl font-bold ${
                  stats.pending_verification > 0
                    ? "text-amber-700"
                    : "text-charcoal"
                }`}
              >
                {stats.pending_verification}
              </p>
              <p className="text-[11px] text-amber-800/80">
                {stats.pending_verification > 0
                  ? "Click to verify payment screenshots →"
                  : "All payments verified ✓"}
              </p>
            </div>

            <div
              onClick={() => onNavigateToOrders("crafting")}
              className="bg-white rounded-2xl border border-warmgrey/70 shadow-2xs p-5 space-y-2 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-charcoal/60 text-xs font-medium">
                <span>In Crafting / Transit</span>
                <Hammer className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-charcoal">
                {(stats.crafting_count || 0) + (stats.shipped_count || 0)}
              </p>
              <p className="text-[11px] text-charcoal/50">
                {stats.crafting_count || 0} in crafting, {stats.shipped_count || 0} in transit
              </p>
            </div>
          </div>

          {/* ── Custom Commissions & Inquiries Spotlight Banner ── */}
          <div className="bg-gradient-to-r from-[#faf5eb] via-white to-[#faf5eb] p-5 rounded-2xl border-2 border-brand-gold/60 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-green shrink-0">
                <Sparkles className="w-6 h-6 text-brand-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base text-brand-green">
                    Custom Artisan Commissions &amp; Inquiries Hub
                  </h3>
                  {pendingCustomCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {pendingCustomCount} Active / Pending
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-brown">
                      Bespoke Hub
                    </span>
                  )}
                </div>
                <p className="text-xs text-charcoal/70 mt-1">
                  Manage incoming customer WhatsApp specifications, review dimensions, set approved quotes (₹), and unlock 1-time Add to Cart permissions.
                </p>
              </div>
            </div>
            {onNavigateToCustomInquiries && (
              <button
                onClick={onNavigateToCustomInquiries}
                className="px-4 py-2.5 rounded-xl bg-brand-green text-white hover:bg-brand-brown text-xs font-semibold flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-brand-gold" />
                Open Custom Inquiries Tab &rarr;
              </button>
            )}
          </div>

          {/* ── Interactive Order Pipeline Stage Summary ── */}
          <div className="bg-white rounded-2xl border border-warmgrey/70 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-green" />
                  Order Pipeline Stage Telemetry
                </h3>
                <p className="text-xs text-charcoal/50 mt-0.5">
                  Click any stage card to filter and manage those orders directly.
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">
                Interactive Lifecycle
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {[
                {
                  id: "needs_verification" as const,
                  label: "1. Verification",
                  desc: "Awaiting UPI / Conf.",
                  count: stats.pending_verification,
                  color:
                    stats.pending_verification > 0
                      ? "border-amber-300 bg-amber-50/60 text-amber-900"
                      : "border-warmgrey/60 bg-brand-cream/40 text-charcoal/70",
                },
                {
                  id: "crafting" as const,
                  label: "2. Artisan Crafting",
                  desc: "Srinagar Wood Studio",
                  count: stats.crafting_count || 0,
                  color:
                    (stats.crafting_count || 0) > 0
                      ? "border-indigo-300 bg-indigo-50/60 text-indigo-900"
                      : "border-warmgrey/60 bg-brand-cream/40 text-charcoal/70",
                },
                {
                  id: "ready_to_pack" as const,
                  label: "3. Ready to Pack",
                  desc: "Queued for Dispatch",
                  count: stats.ready_to_pack_count || 0,
                  color:
                    (stats.ready_to_pack_count || 0) > 0
                      ? "border-blue-300 bg-blue-50/60 text-blue-900"
                      : "border-warmgrey/60 bg-brand-cream/40 text-charcoal/70",
                },
                {
                  id: "shipped" as const,
                  label: "4. In Transit",
                  desc: "Courier Dispatched",
                  count: stats.shipped_count || 0,
                  color:
                    (stats.shipped_count || 0) > 0
                      ? "border-purple-300 bg-purple-50/60 text-purple-900"
                      : "border-warmgrey/60 bg-brand-cream/40 text-charcoal/70",
                },
                {
                  id: "delivered" as const,
                  label: "5. Delivered",
                  desc: "Destination Reached",
                  count: stats.delivered_count || 0,
                  color: "border-emerald-300 bg-emerald-50/60 text-emerald-900",
                },
              ].map((stage) => (
                <div
                  key={stage.id}
                  onClick={() => onNavigateToOrders(stage.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs hover:scale-[1.02] flex flex-col justify-between ${stage.color}`}
                >
                  <div>
                    <span className="text-xs font-bold block">{stage.label}</span>
                    <span className="text-[10px] opacity-75 block mt-0.5">{stage.desc}</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-current/15">
                    <span className="text-xl font-bold">{stage.count}</span>
                    <span className="text-[10px] font-semibold opacity-60">Manage →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Live Activity Stream & Low Stock Radar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stream */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-warmgrey/70 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-gold" />
                    Live Activity Stream
                  </h3>
                  <p className="text-xs text-charcoal/50">Recent orders across storefront</p>
                </div>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-charcoal/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Quick filter..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-brand-cream/40 border border-warmgrey/70 rounded-lg text-xs text-charcoal outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              {filteredRecentOrders.length === 0 ? (
                <div className="p-8 text-center text-charcoal/50 text-xs">
                  No orders in this activity stream yet.
                </div>
              ) : (
                <div className="divide-y divide-warmgrey/40">
                  {filteredRecentOrders.map((ro) => (
                    <div
                      key={ro.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-brand-green font-mono">
                          #{ro.order_number}
                        </span>
                        <div>
                          <span className="font-medium text-charcoal block">
                            {ro.shipping_name}
                          </span>
                          <span className="text-[10px] text-charcoal/50">
                            {ro.items_count} item(s) • {formatPrice(ro.total)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                          {ro.payment_method}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(
                            ro.status
                          )}`}
                        >
                          {statusLabel(ro.status)}
                        </span>
                        <button
                          onClick={() => onNavigateToOrders("all")}
                          className="text-[11px] font-semibold text-brand-green hover:underline ml-1"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Radar */}
            <div className="bg-white rounded-2xl border border-warmgrey/70 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Low Stock Radar
                </h3>
                <button
                  onClick={onNavigateToInventory}
                  className="text-xs font-semibold text-brand-green hover:underline"
                >
                  Manage →
                </button>
              </div>

              {stats.low_stock_products.length === 0 ? (
                <div className="p-6 text-center text-emerald-800 bg-emerald-50 rounded-xl text-xs space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  <p className="font-bold">Catalog Well Stocked</p>
                  <p className="text-[11px] opacity-75">
                    All products exceed minimum reserves.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.low_stock_products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs"
                    >
                      <span className="font-medium text-charcoal truncate pr-2">
                        {p.name}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {p.stock_quantity} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 2: Orders Pipeline ───────────────────────────────────────────────────

function OrdersTab({
  initialFilter = "needs_verification",
  onFilterChange,
}: {
  initialFilter?: OrderFilter;
  onFilterChange?: (filter: OrderFilter) => void;
} = {}) {
  const [filter, setFilter] = useState<OrderFilter>(initialFilter);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Per-stage search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cashfree" | "whatsapp_upi">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest");

  // Modals & action states
  const [shipModal, setShipModal] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [trackingModal, setTrackingModal] = useState<AdminOrder | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [carrierInput, setCarrierInput] = useState("Delhivery");
  const [trackingUrlInput, setTrackingUrlInput] = useState("");
  const [statusNoteInput, setStatusNoteInput] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Batch & Single Order Printing State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [printOrders, setPrintOrders] = useState<AdminOrder[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const openPrintForOrder = (ord: AdminOrder) => {
    setPrintOrders([ord]);
    setIsPrintModalOpen(true);
  };

  const openBatchPrint = () => {
    const selected = orders.filter((o) => selectedOrderIds.includes(o.id));
    if (selected.length > 0) {
      setPrintOrders(selected);
      setIsPrintModalOpen(true);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length && orders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  // Sync state if initialFilter prop changes (e.g. from Live Pulse stage card click)
  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  const handleFilterClick = (newFilter: OrderFilter) => {
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const params = new URLSearchParams();
      if (filter) params.append("status_filter", filter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (paymentFilter !== "all") params.append("payment_method", paymentFilter);
      if (sortBy !== "newest") params.append("sort_by", sortBy);

      const data = await api.get<{ orders: AdminOrder[] }>(
        `/api/admin/orders?${params.toString()}`
      );
      setOrders(data.orders || []);
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      setOrdersError(
        err instanceof Error ? err.message : "Failed to load orders"
      );
    } finally {
      setOrdersLoading(false);
    }
  }, [filter, searchQuery, paymentFilter, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const approvePayment = async (orderId: string) => {
    setActionLoading(orderId + "_approve");
    try {
      await api.put(`/api/admin/orders/${orderId}/approve-payment`, {});
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve payment");
    } finally {
      setActionLoading(null);
    }
  };

  const startCrafting = async (orderId: string) => {
    setActionLoading(orderId + "_craft");
    try {
      await api.put(`/api/admin/orders/${orderId}/start-crafting`, {});
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to move order to Crafting");
    } finally {
      setActionLoading(null);
    }
  };

  const readyToPack = async (orderId: string) => {
    setActionLoading(orderId + "_ready");
    try {
      await api.put(`/api/admin/orders/${orderId}/ready-to-pack`, {});
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark order Ready to Pack");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    const reason = prompt("Enter cancellation reason (optional):");
    if (reason === null) return;
    setActionLoading(orderId + "_cancel");
    try {
      await api.put(`/api/admin/orders/${orderId}/cancel`, {
        reason: reason || "Cancelled by admin",
      });
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setActionLoading(null);
    }
  };

  const shipOrder = async () => {
    if (!shipModal) return;
    setActionLoading(shipModal.orderId + "_ship");
    try {
      await api.put(`/api/admin/orders/${shipModal.orderId}/ship`, {
        tracking_number: trackingInput.trim() || undefined,
        carrier: carrierInput.trim() || undefined,
        tracking_url: trackingUrlInput.trim() || undefined,
        status_note: statusNoteInput.trim() || undefined,
      });
      setShipModal(null);
      setTrackingInput("");
      setCarrierInput("Delhivery");
      setTrackingUrlInput("");
      setStatusNoteInput("");
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to ship order");
    } finally {
      setActionLoading(null);
    }
  };

  const updateTracking = async () => {
    if (!trackingModal) return;
    setActionLoading(trackingModal.id + "_tracking");
    try {
      await api.put(`/api/admin/orders/${trackingModal.id}/tracking`, {
        tracking_number: trackingInput.trim() || undefined,
        carrier: carrierInput.trim() || undefined,
        tracking_url: trackingUrlInput.trim() || undefined,
        status_note: statusNoteInput.trim() || undefined,
      });
      setTrackingModal(null);
      setTrackingInput("");
      setCarrierInput("Delhivery");
      setTrackingUrlInput("");
      setStatusNoteInput("");
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update tracking");
    } finally {
      setActionLoading(null);
    }
  };

  const markDelivered = async (orderId: string) => {
    if (!confirm("Are you sure you want to mark this order as Delivered? This will notify the customer and update the live delivery timeline.")) return;
    setActionLoading(orderId + "_deliver");
    try {
      await api.put(`/api/admin/orders/${orderId}/deliver`, {
        status_note: "Package successfully delivered to customer.",
      });
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark order delivered");
    } finally {
      setActionLoading(null);
    }
  };

  const revertToVerification = async (orderId: string) => {
    if (!confirm("Revert this order back to Needs Verification?")) return;
    setActionLoading(orderId + "_revert");
    try {
      await api.put(`/api/admin/orders/${orderId}/revert-to-verification`, {});
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revert order");
    } finally {
      setActionLoading(null);
    }
  };

  const revertToCrafting = async (orderId: string) => {
    if (!confirm("Return this order back to Artisan Crafting workshop?")) return;
    setActionLoading(orderId + "_revert");
    try {
      await api.put(`/api/admin/orders/${orderId}/revert-to-crafting`, {});
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to return to crafting");
    } finally {
      setActionLoading(null);
    }
  };

  const revertToReadyToPack = async (orderId: string) => {
    if (!confirm("Revert this order back to Ready to Pack?")) return;
    setActionLoading(orderId + "_revert");
    try {
      await api.put(`/api/admin/orders/${orderId}/revert-to-ready-to-pack`, {});
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revert to ready to pack");
    } finally {
      setActionLoading(null);
    }
  };

  const revertToShipped = async (orderId: string) => {
    if (!confirm("Revert this order back to In Transit / Shipped?")) return;
    setActionLoading(orderId + "_revert");
    try {
      await api.put(`/api/admin/orders/${orderId}/revert-to-shipped`, {});
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revert to in transit");
    } finally {
      setActionLoading(null);
    }
  };

  const filterPills: { id: OrderFilter; label: string; icon: React.ElementType }[] = [
    { id: "needs_verification", label: "Needs Verification", icon: Clock },
    { id: "crafting", label: "Artisan Crafting", icon: Hammer },
    { id: "ready_to_pack", label: "Ready to Pack", icon: Package },
    { id: "shipped", label: "In Transit / Shipped", icon: Truck },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
    { id: "all", label: "All Orders", icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Orders Pipeline
          </h2>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Discrete lifecycle tracking aligned with Kashmir atelier crafting and courier delivery.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={ordersLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-warmgrey/70 bg-white text-charcoal text-xs font-semibold hover:bg-brand-cream transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stage Tabs (Pills) */}
      <div className="flex flex-wrap gap-2">
        {filterPills.map((pill) => {
          const Icon = pill.icon;
          const active = filter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => handleFilterClick(pill.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                active
                  ? "bg-brand-green text-white border-brand-green shadow-xs"
                  : "bg-white text-charcoal/70 border-warmgrey/70 hover:border-brand-green hover:text-brand-green hover:bg-brand-cream/30"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filters Toolbar inside Stage */}
      <div className="bg-white rounded-2xl border border-warmgrey/70 p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within this stage by #DC-..., customer, phone, city, or AWB..."
            className="w-full bg-stone-50 border border-warmgrey/60 rounded-xl pl-10 pr-9 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Payment filter */}
          <div className="flex items-center gap-1.5 text-xs text-charcoal/60 bg-stone-50 border border-warmgrey/60 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-charcoal/50" />
            <span className="font-semibold text-charcoal/70">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="bg-transparent text-charcoal font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="cashfree">Cashfree</option>
              <option value="whatsapp_upi">WhatsApp UPI</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 text-xs text-charcoal/60 bg-stone-50 border border-warmgrey/60 rounded-xl px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-charcoal/50" />
            <span className="font-semibold text-charcoal/70">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-charcoal font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {ordersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-medium">
          {ordersError}
        </div>
      )}

      {ordersLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warmgrey/70 p-12 text-center text-charcoal/50 space-y-2">
          <Package className="w-10 h-10 text-charcoal/30 mx-auto" />
          <p className="font-medium text-sm">No orders found in this stage.</p>
          <p className="text-xs text-charcoal/40">
            {searchQuery || paymentFilter !== "all"
              ? "Try adjusting your search query or payment filters."
              : "Orders will appear here as customers complete checkout."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Batch Selection Action Bar */}
          {selectedOrderIds.length > 0 && (
            <div className="sticky top-4 z-20 bg-brand-green text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 border border-brand-green/30">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedOrderIds.length === orders.length && orders.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-brand-green accent-brand-gold cursor-pointer"
                />
                <span className="text-xs font-bold">
                  {selectedOrderIds.length} {selectedOrderIds.length === 1 ? "Order" : "Orders"} Selected for Printing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openBatchPrint}
                  className="bg-white text-brand-green hover:bg-brand-cream px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Batch Print Slips ({selectedOrderIds.length})
                </button>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="text-white/80 hover:text-white text-xs underline font-medium ml-1"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-warmgrey/70 shadow-2xs hover:shadow-sm transition-shadow p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.id)}
                    onChange={() => toggleSelectOrder(order.id)}
                    className="w-4 h-4 rounded text-brand-green accent-brand-green cursor-pointer"
                    title="Select for batch A4 printing"
                  />
                  <span className="font-bold text-brand-green text-lg font-mono">
                    #{order.order_number}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(
                      order.status
                    )}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 uppercase">
                    {order.payment_method}
                  </span>
                </div>
                <span className="text-xs text-charcoal/50">
                  {formatDate(order.created_at)}
                </span>
              </div>

              {/* Customer */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-charcoal">
                  {order.shipping_name}
                </span>
                <span className="text-sm text-charcoal/60">
                  {order.shipping_phone}
                </span>
                <a
                  href={`https://wa.me/91${order.shipping_phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>

              {/* Items */}
              <div className="bg-brand-cream/50 rounded-xl p-4 space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-charcoal">
                      {item.product_name}{" "}
                      <span className="text-charcoal/50">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-charcoal">
                      {formatPrice(item.total_price)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-warmgrey/50 pt-2 flex justify-between font-bold text-charcoal">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Address */}
              <div className="text-xs text-charcoal/60">
                📦{" "}
                {[
                  order.shipping_address_line_1,
                  order.shipping_address_line_2,
                  order.shipping_city,
                  order.shipping_state,
                  order.shipping_pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>

              {/* Tracking & Logistics Status */}
              {(order.tracking_number || order.carrier || order.tracking_status_note) && (
                <div className="text-xs space-y-1.5 p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold flex items-center gap-1.5 text-purple-800">
                      <Truck className="w-4 h-4 text-purple-600" />
                      {order.carrier || "Courier"}: <span className="font-mono">{order.tracking_number || "Pending"}</span>
                    </span>
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-700 underline font-semibold hover:text-purple-900 flex items-center gap-1"
                      >
                        Open Carrier Tracking <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {order.tracking_status_note && (
                    <p className="text-purple-800/80 italic text-[11px] bg-white/70 p-1.5 rounded-lg border border-purple-100">
                      📍 Status update: &ldquo;{order.tracking_status_note}&rdquo;
                    </p>
                  )}
                  {order.delivered_at && (
                    <p className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered on:{" "}
                      {new Date(order.delivered_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Cancel reason */}
              {order.cancel_reason && (
                <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                  Cancellation reason: {order.cancel_reason}
                </div>
              )}

              {/* Lifecycle Stage Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {/* Stage 1: Needs Verification */}
                {(order.status === "payment_verification" || order.status === "pending" || order.status === "payment_pending") && (
                  <button
                    onClick={() => approvePayment(order.id)}
                    disabled={actionLoading === order.id + "_approve"}
                    className="bg-brand-green text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-green/90 disabled:opacity-60 flex items-center gap-2 transition-colors shadow-xs"
                  >
                    {actionLoading === order.id + "_approve" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Approve Payment ➔ Artisan Crafting
                  </button>
                )}

                {/* Stage 2: Artisan Crafting (processing) */}
                {order.status === "processing" && (
                  <>
                    <button
                      onClick={() => readyToPack(order.id)}
                      disabled={actionLoading === order.id + "_ready"}
                      className="bg-brand-green text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-brand-green/90 disabled:opacity-60 transition-colors shadow-xs"
                    >
                      {actionLoading === order.id + "_ready" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Package className="w-3.5 h-3.5" />
                      )}
                      Crafting Complete ➔ Ready to Pack
                    </button>
                    <button
                      onClick={() => revertToVerification(order.id)}
                      disabled={actionLoading === order.id + "_revert"}
                      className="bg-stone-100 text-charcoal/80 border border-warmgrey/70 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                      title="Step back to Payment Verification"
                    >
                      <RotateCcw className="w-3 h-3 text-charcoal/60" />
                      Revert to Verification
                    </button>
                  </>
                )}

                {/* Stage 3: Ready to Pack (confirmed) */}
                {order.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => {
                        setShipModal({
                          orderId: order.id,
                          orderNumber: order.order_number,
                        });
                        setTrackingInput(order.tracking_number || "");
                        setCarrierInput(order.carrier || "Delhivery");
                        setTrackingUrlInput(order.tracking_url || "");
                        setStatusNoteInput("Dispatched from Srinagar Studio");
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Packaged ➔ Mark Shipped (In Transit)
                    </button>
                    <button
                      onClick={() => revertToCrafting(order.id)}
                      disabled={actionLoading === order.id + "_revert"}
                      className="bg-stone-100 text-charcoal/80 border border-warmgrey/70 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                      title="Step back to Artisan Crafting"
                    >
                      <RotateCcw className="w-3 h-3 text-charcoal/60" />
                      Back to Artisan Crafting
                    </button>
                  </>
                )}

                {/* Stage 4: In Transit / Shipped */}
                {order.status === "shipped" && (
                  <>
                    <button
                      onClick={() => markDelivered(order.id)}
                      disabled={actionLoading === order.id + "_deliver"}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-xs"
                    >
                      {actionLoading === order.id + "_deliver" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Mark Delivered
                    </button>
                    <button
                      onClick={() => {
                        setTrackingModal(order);
                        setTrackingInput(order.tracking_number || "");
                        setCarrierInput(order.carrier || "Delhivery");
                        setTrackingUrlInput(order.tracking_url || "");
                        setStatusNoteInput(order.tracking_status_note || "");
                      }}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-700 transition-colors shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Update Tracking / Note
                    </button>
                    <button
                      onClick={() => revertToReadyToPack(order.id)}
                      disabled={actionLoading === order.id + "_revert"}
                      className="bg-stone-100 text-charcoal/80 border border-warmgrey/70 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                      title="Step back to Ready to Pack"
                    >
                      <RotateCcw className="w-3 h-3 text-charcoal/60" />
                      Back to Ready to Pack
                    </button>
                  </>
                )}

                {/* Stage 5: Delivered */}
                {order.status === "delivered" && (
                  <>
                    <button
                      onClick={() => {
                        setTrackingModal(order);
                        setTrackingInput(order.tracking_number || "");
                        setCarrierInput(order.carrier || "Delhivery");
                        setTrackingUrlInput(order.tracking_url || "");
                        setStatusNoteInput(order.tracking_status_note || "");
                      }}
                      className="bg-stone-100 text-charcoal border border-warmgrey/70 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
                    >
                      Edit Tracking Info
                    </button>
                    <button
                      onClick={() => revertToShipped(order.id)}
                      disabled={actionLoading === order.id + "_revert"}
                      className="bg-stone-100 text-charcoal/80 border border-warmgrey/70 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                      title="Step back to In Transit"
                    >
                      <RotateCcw className="w-3 h-3 text-charcoal/60" />
                      Return to In Transit
                    </button>
                  </>
                )}

                {/* A4 Print Slips & Invoices Action */}
                <button
                  onClick={() => openPrintForOrder(order)}
                  className="bg-stone-50 text-charcoal border border-warmgrey/80 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-brand-cream transition-colors shadow-2xs"
                  title="Print Outer Box Shipping Slip & Inner Packing Invoice on A4"
                >
                  <Printer className="w-3.5 h-3.5 text-brand-green" />
                  Print Slips (A4)
                </button>

                {/* Universal Cancel Button for in-flight orders */}
                {order.status !== "cancelled" &&
                  order.status !== "delivered" && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      disabled={actionLoading === order.id + "_cancel"}
                      className="bg-red-50 text-red-600 border border-red-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-red-100 disabled:opacity-60 transition-colors"
                    >
                      {actionLoading === order.id + "_cancel" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Cancel Order
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ship Modal */}
      {shipModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-charcoal flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" /> Ship Order #{shipModal.orderNumber}
            </h3>
            
            {/* Courier quick pills */}
            <div>
              <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                Courier Partner
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {["Delhivery", "Blue Dart", "India Post", "DTDC", "Trackon"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarrierInput(c)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      carrierInput === c
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-charcoal/70 border-warmgrey hover:border-blue-500"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={carrierInput}
                onChange={(e) => setCarrierInput(e.target.value)}
                placeholder="Courier name (e.g. Delhivery)"
                className="w-full border border-warmgrey/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
                  Tracking / AWB Number (Optional)
                </label>
                <span className="text-[10px] text-charcoal/50 italic">
                  Leave blank for offline India Post booking
                </span>
              </div>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Enter AWB (or leave blank to write by pen on printed receipt)"
                className="w-full border border-warmgrey/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                Tracking Link URL (Optional)
              </label>
              <input
                type="url"
                value={trackingUrlInput}
                onChange={(e) => setTrackingUrlInput(e.target.value)}
                placeholder="https://www.delhivery.com/track/package/..."
                className="w-full border border-warmgrey/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                Initial Status / Location Note for Customer
              </label>
              <input
                type="text"
                value={statusNoteInput}
                onChange={(e) => setStatusNoteInput(e.target.value)}
                placeholder="e.g. Handcrafted item dispatched from Srinagar Studio"
                className="w-full border border-warmgrey/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={shipOrder}
                disabled={actionLoading === shipModal.orderId + "_ship"}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {actionLoading === shipModal.orderId + "_ship" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                Confirm Dispatch
              </button>
              <button
                onClick={() => {
                  setShipModal(null);
                  setTrackingInput("");
                }}
                className="flex-1 bg-gray-100 text-charcoal px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Tracking Modal */}
      {trackingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-charcoal flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-600" /> Update Tracking #{trackingModal.order_number}
            </h3>

            {/* Courier quick pills */}
            <div>
              <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                Courier Partner
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {["Delhivery", "Blue Dart", "India Post", "DTDC", "Trackon"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarrierInput(c)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      carrierInput === c
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-charcoal/70 border-warmgrey hover:border-purple-500"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={carrierInput}
                onChange={(e) => setCarrierInput(e.target.value)}
                placeholder="Courier partner name"
                className="w-full border border-warmgrey/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                Tracking / AWB Number
              </label>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Tracking number"
                className="w-full border border-warmgrey/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                Live Status / Location Note for Customer
              </label>
              <input
                type="text"
                value={statusNoteInput}
                onChange={(e) => setStatusNoteInput(e.target.value)}
                placeholder="e.g. In Transit: Arrived at Delhi Sorting Hub"
                className="w-full border border-warmgrey/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <p className="text-[11px] text-charcoal/50 mt-1">
                This note will be displayed live on the customer&apos;s order tracking timeline.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                Tracking Link URL (Optional)
              </label>
              <input
                type="url"
                value={trackingUrlInput}
                onChange={(e) => setTrackingUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full border border-warmgrey/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={updateTracking}
                disabled={actionLoading === trackingModal.id + "_tracking"}
                className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {actionLoading === trackingModal.id + "_tracking" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                Save Status Update
              </button>
              <button
                onClick={() => setTrackingModal(null)}
                className="flex-1 bg-gray-100 text-charcoal px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Order Slips & Invoice Print Modal */}
      <OrderPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        orders={printOrders}
      />
    </div>
  );
}

// ─── Tab 3: Customers ─────────────────────────────────────────────────────────

function CustomersTab() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteModalCustomer, setDeleteModalCustomer] = useState<AdminCustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ customers: AdminCustomer[] }>(
        "/api/admin/customers"
      );
      setCustomers(data.customers || []);
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      setError(
        err instanceof Error ? err.message : "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDeleteCustomer = async () => {
    if (!deleteModalCustomer) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/admin/customers/${deleteModalCustomer.id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteModalCustomer.id));
      setDeleteModalCustomer(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Customers &amp; Accounts
          </h2>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Registered atelier clientele, lifetime value analytics, and account administration.
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-warmgrey/70 bg-white text-charcoal text-xs font-semibold hover:bg-brand-cream transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Customer Search Toolbar */}
      <div className="bg-white rounded-2xl border border-warmgrey/70 p-4 shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full bg-stone-50 border border-warmgrey/60 rounded-xl pl-10 pr-9 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warmgrey/70 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-cream border-b border-warmgrey/70">
                <tr>
                  {[
                    "Name",
                    "Email",
                    "Phone",
                    "Registered",
                    "Orders",
                    "Spent",
                    "Wishlist",
                    "Contact",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-bold text-charcoal/60 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgrey/40">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-10 text-charcoal/40 text-xs"
                    >
                      {search ? "No customers matching your search." : "No customers found."}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const isAdmin = c.role === "admin";
                    return (
                      <tr
                        key={c.id}
                        className={`transition-colors ${
                          isAdmin
                            ? "bg-amber-50/70 border-l-4 border-l-brand-gold hover:bg-amber-50"
                            : "hover:bg-brand-cream/30"
                        }`}
                      >
                        <td className="px-5 py-4 font-semibold text-charcoal text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{c.full_name}</span>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-brand-green text-brand-gold px-2 py-0.5 rounded-full border border-brand-gold/30 shadow-xs">
                                <Shield className="w-3 h-3 text-brand-gold" /> Admin User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={isAdmin ? "font-semibold text-brand-green" : "text-charcoal/70"}>
                              {c.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-charcoal/70">
                          {c.phone ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-xs text-charcoal/60">
                          {new Date(c.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-4 text-xs text-center font-semibold text-charcoal">
                          {c.total_orders}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-brand-green">
                          {formatPrice(c.total_spent)}
                        </td>
                        <td className="px-5 py-4 text-xs text-center text-charcoal/70">
                          {c.wishlist_count}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {c.phone ? (
                            <a
                              href={`https://wa.me/91${c.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 w-fit hover:bg-emerald-700 transition-colors shadow-2xs"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
                          ) : (
                            <span className="text-charcoal/30 text-xs">
                              No phone
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {isAdmin ? (
                            <span className="text-[10px] font-semibold text-charcoal/40 bg-stone-100 px-2 py-0.5 rounded">
                              Protected
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteModalCustomer(c);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-200 transition-all"
                              title="Delete Customer Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteModalCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-charcoal">
                  Delete Customer Account
                </h3>
                <p className="text-xs text-charcoal/60">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 border border-warmgrey/60 rounded-xl p-3.5 text-xs space-y-1.5 text-charcoal">
              <div>
                <span className="font-bold">Customer: </span>
                <span>{deleteModalCustomer.full_name}</span>
              </div>
              <div>
                <span className="font-bold">Email: </span>
                <span className="font-mono">{deleteModalCustomer.email}</span>
              </div>
              <div className="text-charcoal/60 text-[11px] pt-1">
                Total Orders: {deleteModalCustomer.total_orders} • Total Spent: {formatPrice(deleteModalCustomer.total_spent)}
              </div>
            </div>

            <p className="text-xs text-charcoal/70 leading-relaxed">
              Deleting this customer will remove their Supabase Auth credentials, customer profile, and active wishlists. Historical orders will remain securely archived with contact records for compliance.
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Confirm Delete
              </button>
              <button
                onClick={() => {
                  setDeleteModalCustomer(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 bg-stone-100 text-charcoal px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Inventory ─────────────────────────────────────────────────────────

type InventoryEdit = { stock: number; saving: boolean; saved: boolean };

function InventoryTab() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, InventoryEdit>>({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<{ products?: AdminProduct[] } | AdminProduct[]>(
          "/api/admin/inventory"
        );
        const list: AdminProduct[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];
        setProducts(list);
        const initial: Record<string, InventoryEdit> = {};
        list.forEach((p) => {
          if (p && p.id) {
            initial[p.id] = { stock: p.stock_quantity ?? 0, saving: false, saved: false };
          }
        });
        setEdits(initial);
      } catch (err) {
        if (handleAdminAuthError(err)) return;
        setError(
          err instanceof Error ? err.message : "Failed to load inventory"
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const updateStock = (id: string, value: number) => {
    setEdits((prev) => {
      const current = prev[id] ?? { stock: 0, saving: false, saved: false };
      return {
        ...prev,
        [id]: { ...current, stock: Math.max(0, value), saved: false },
      };
    });
  };

  const saveStock = async (id: string) => {
    const edit = edits[id] ?? {
      stock: products.find((p) => p.id === id)?.stock_quantity ?? 0,
      saving: false,
      saved: false,
    };
    setEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? edit), saving: true },
    }));
    try {
      await api.put(`/api/admin/inventory/${id}`, {
        stock_quantity: edit.stock,
      });
      setEdits((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? edit), saving: false, saved: true },
      }));
      setTimeout(() => {
        setEdits((prev) => ({
          ...prev,
          [id]: { ...(prev[id] ?? edit), saved: false },
        }));
      }, 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save stock");
      setEdits((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? edit), saving: false },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-charcoal">
        Inventory Controller
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const edit = edits[p.id] ?? {
              stock: p.stock_quantity,
              saving: false,
              saved: false,
            };
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-warmgrey/70 shadow-sm p-5 flex flex-wrap items-center gap-4"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-charcoal">{p.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        p.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal/50 mt-0.5">
                    /{p.slug} &nbsp;·&nbsp; {formatPrice(p.price)}
                  </p>
                </div>

                {/* Stock controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStock(p.id, edit.stock - 1)}
                    className="w-8 h-8 rounded-lg border border-warmgrey/70 flex items-center justify-center hover:bg-brand-cream transition-colors text-charcoal"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={edit.stock}
                    onChange={(e) =>
                      updateStock(p.id, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-20 text-center border border-warmgrey/70 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <button
                    onClick={() => updateStock(p.id, edit.stock + 1)}
                    className="w-8 h-8 rounded-lg border border-warmgrey/70 flex items-center justify-center hover:bg-brand-cream transition-colors text-charcoal"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Save button */}
                <button
                  onClick={() => saveStock(p.id)}
                  disabled={edit.saving}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                    edit.saved
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-60"
                  }`}
                >
                  {edit.saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : edit.saved ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : null}
                  {edit.saved ? "Saved!" : "Save"}
                </button>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="bg-white rounded-2xl border border-warmgrey/70 p-12 text-center text-charcoal/40">
              No products found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab 5: Traffic & Analytics ───────────────────────────────────────────────

function TrafficTab() {
  const sections = [
    {
      icon: BarChart3,
      title: "Google Analytics 4",
      url: "https://analytics.google.com",
      linkLabel: "Open GA4 Dashboard",
      note: "Connect GA4 to your domain in next.config.js with the measurement ID. Full traffic tracking is set up via GA4 script in your Next.js app.",
      color: "text-orange-600 bg-orange-50",
    },
    {
      icon: Eye,
      title: "Microsoft Clarity",
      url: "https://clarity.microsoft.com",
      linkLabel: "Open Clarity Dashboard",
      note: "Clarity provides free session recordings and heatmaps. Great for understanding how customers interact with product pages and the checkout flow.",
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: Boxes,
      title: "Supabase Dashboard",
      url: "https://supabase.com/dashboard",
      linkLabel: "Open Supabase Dashboard",
      note: "Monitor database queries, user auth, storage, and edge functions in real time. Use the SQL editor to run custom reports on orders and revenue.",
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Traffic &amp; Analytics
        </h2>
        <p className="text-sm text-charcoal/50 mt-1">
          Full traffic tracking is set up via GA4 script in your Next.js app.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="bg-white rounded-2xl border border-warmgrey/70 shadow-sm p-6 space-y-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-charcoal">
                {s.title}
              </h3>
              <p className="text-sm text-charcoal/60 leading-relaxed">{s.note}</p>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:text-brand-green/80 transition-colors"
              >
                {s.linkLabel}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          );
        })}
      </div>

      <div className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-6">
        <h4 className="font-semibold text-brand-green mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Setup Note
        </h4>
        <p className="text-sm text-charcoal/70 leading-relaxed">
          Full traffic tracking is set up via GA4 script in your Next.js app.
          Add your GA4 Measurement ID to <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono border border-warmgrey/50">next.config.js</code> and
          your Clarity Project ID in the head script. Both tools are free and
          provide complementary insights — GA4 for aggregated traffic data and
          Clarity for session-level behavior analysis.
        </p>
      </div>
    </div>
  );
}
