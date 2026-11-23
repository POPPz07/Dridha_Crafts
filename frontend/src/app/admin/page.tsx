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
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AdminStats = {
  today_orders: number;
  today_revenue: number;
  pending_verification: number;
  low_stock_products: { id: string; name: string; stock_quantity: number }[];
  all_time_orders: number;
};

type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
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
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    pending: "Pending",
    processing: "Processing",
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

type TabId = "pulse" | "orders" | "customers" | "inventory" | "traffic";
type OrderFilter = "needs_verification" | "ready_to_pack" | "shipped" | "all";

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("pulse");

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
      <nav className="bg-white border-b border-warmgrey sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 flex gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
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
      <main className="max-w-7xl mx-auto px-8 py-8">
        <AdminErrorBoundary key={activeTab} fallbackTitle={`Error loading ${activeTab} tab`}>
          {activeTab === "pulse" && <PulseTab />}
          {activeTab === "orders" && <OrdersTab />}
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

function PulseTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<AdminStats>("/api/admin/stats");
      setStats(data);
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Live Pulse
        </h2>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-warmgrey/70 text-charcoal px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-cream transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
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
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Today's Orders"
              value={stats.today_orders}
              icon={Package}
            />
            <StatCard
              label="Today's Revenue"
              value={formatPrice(stats.today_revenue)}
              icon={TrendingUp}
            />
            <StatCard
              label="Pending Verification"
              value={stats.pending_verification}
              icon={AlertTriangle}
              highlight={stats.pending_verification > 0}
            />
            <StatCard
              label="Total Orders"
              value={stats.all_time_orders}
              icon={BarChart3}
            />
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl border border-warmgrey/70 shadow-sm p-6">
            <h3 className="font-semibold text-charcoal text-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Low Stock Alerts
            </h3>
            {stats.low_stock_products.length === 0 ? (
              <p className="text-charcoal/50 text-sm">
                All products are well-stocked. ✓
              </p>
            ) : (
              <div className="space-y-3">
                {stats.low_stock_products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                  >
                    <span className="text-sm font-medium text-charcoal">
                      {p.name}
                    </span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                      {p.stock_quantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 2: Orders Pipeline ───────────────────────────────────────────────────

function OrdersTab() {
  const [filter, setFilter] = useState<OrderFilter>("needs_verification");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
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

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await api.get<{ orders: AdminOrder[] }>(
        `/api/admin/orders?status_filter=${filter}`
      );
      setOrders(data.orders);
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      setOrdersError(
        err instanceof Error ? err.message : "Failed to load orders"
      );
    } finally {
      setOrdersLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
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

  const cancelOrder = async (orderId: string) => {
    const reason = prompt("Enter cancellation reason (optional):");
    if (reason === null) return; // user cancelled the prompt
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
    if (!shipModal || !trackingInput.trim()) return;
    setActionLoading(shipModal.orderId + "_ship");
    try {
      await api.put(`/api/admin/orders/${shipModal.orderId}/ship`, {
        tracking_number: trackingInput.trim(),
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
    if (!confirm("Are you sure you want to mark this order as Delivered?")) return;
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

  const filterPills: { id: OrderFilter; label: string }[] = [
    { id: "needs_verification", label: "Needs Verification" },
    { id: "ready_to_pack", label: "Ready to Pack" },
    { id: "shipped", label: "Shipped" },
    { id: "all", label: "All Orders" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-charcoal">
        Orders Pipeline
      </h2>

      {/* Filter sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            onClick={() => setFilter(pill.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              filter === pill.id
                ? "bg-brand-green text-white border-brand-green"
                : "bg-white text-charcoal/70 border-warmgrey/70 hover:border-brand-green hover:text-brand-green"
            }`}
          >
            {pill.label}
          </button>
        ))}
        <button
          onClick={fetchOrders}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full border border-warmgrey/70 bg-white text-charcoal/60 text-sm hover:text-charcoal transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {ordersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {ordersError}
        </div>
      )}

      {ordersLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warmgrey/70 p-12 text-center text-charcoal/50">
          No orders in this category.
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-warmgrey/70 shadow-sm p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-charcoal text-lg">
                    #{order.order_number}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(
                      order.status
                    )}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 uppercase">
                    {order.payment_method}
                  </span>
                </div>
                <span className="text-sm text-charcoal/50">
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
                  className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-green-600 transition-colors"
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
              <div className="text-sm text-charcoal/60">
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
                        className="text-purple-700 underline font-semibold hover:text-purple-900"
                      >
                        Open Carrier Tracking ↗
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
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  Cancellation reason: {order.cancel_reason}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {order.status === "payment_verification" && (
                  <button
                    onClick={() => approvePayment(order.id)}
                    disabled={actionLoading === order.id + "_approve"}
                    className="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-green/90 disabled:opacity-60 flex items-center gap-2 transition-colors"
                  >
                    {actionLoading === order.id + "_approve" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approve Payment
                  </button>
                )}
                {order.status === "confirmed" && (
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Mark Shipped
                  </button>
                )}
                {order.status === "shipped" && (
                  <>
                    <button
                      onClick={() => {
                        setTrackingModal(order);
                        setTrackingInput(order.tracking_number || "");
                        setCarrierInput(order.carrier || "Delhivery");
                        setTrackingUrlInput(order.tracking_url || "");
                        setStatusNoteInput(order.tracking_status_note || "");
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-purple-700 transition-colors"
                    >
                      <Truck className="w-4 h-4" />
                      Update Tracking / Location
                    </button>
                    <button
                      onClick={() => markDelivered(order.id)}
                      disabled={actionLoading === order.id + "_deliver"}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                    >
                      {actionLoading === order.id + "_deliver" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Mark Delivered
                    </button>
                  </>
                )}
                {order.status === "delivered" && (
                  <button
                    onClick={() => {
                      setTrackingModal(order);
                      setTrackingInput(order.tracking_number || "");
                      setCarrierInput(order.carrier || "Delhivery");
                      setTrackingUrlInput(order.tracking_url || "");
                      setStatusNoteInput(order.tracking_status_note || "");
                    }}
                    className="bg-stone-100 text-charcoal border border-warmgrey px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
                  >
                    Edit Tracking Info
                  </button>
                )}
                {order.status !== "cancelled" &&
                  order.status !== "delivered" && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      disabled={actionLoading === order.id + "_cancel"}
                      className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-red-100 disabled:opacity-60 transition-colors"
                    >
                      {actionLoading === order.id + "_cancel" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
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
              <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                Tracking / AWB Number *
              </label>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Enter AWB or consignment number"
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
                disabled={
                  !trackingInput.trim() ||
                  actionLoading === shipModal.orderId + "_ship"
                }
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
    </div>
  );
}

// ─── Tab 3: Customers ─────────────────────────────────────────────────────────

function CustomersTab() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<{ customers: AdminCustomer[] }>(
          "/api/admin/customers"
        );
        setCustomers(data.customers);
      } catch (err) {
        if (handleAdminAuthError(err)) return;
        setError(
          err instanceof Error ? err.message : "Failed to load customers"
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-charcoal">
        Customers &amp; Wishlist
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
        <div className="bg-white rounded-2xl border border-warmgrey/70 shadow-sm overflow-hidden">
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
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-10 text-charcoal/40"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
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
                        <td className="px-5 py-4 font-semibold text-charcoal">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{c.full_name}</span>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-brand-green text-brand-gold px-2 py-0.5 rounded-full border border-brand-gold/30 shadow-xs">
                                <Shield className="w-3 h-3 text-brand-gold" /> Admin User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={isAdmin ? "font-semibold text-brand-green" : "text-charcoal/70"}>
                              {c.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-charcoal/70">
                          {c.phone ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-charcoal/60">
                          {new Date(c.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-charcoal">
                          {c.total_orders}
                        </td>
                        <td className="px-5 py-4 font-semibold text-brand-green">
                          {formatPrice(c.total_spent)}
                        </td>
                        <td className="px-5 py-4 text-center text-charcoal/70">
                          {c.wishlist_count}
                        </td>
                        <td className="px-5 py-4">
                          {c.phone ? (
                            <a
                              href={`https://wa.me/91${c.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 w-fit hover:bg-green-600 transition-colors"
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
