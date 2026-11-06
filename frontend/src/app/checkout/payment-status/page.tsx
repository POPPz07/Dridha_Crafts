"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";

interface PaymentStatusData {
  payment_id: string;
  order_id: string;
  order_number: string;
  merchant_order_id: string;
  cf_order_id?: string | null;
  status: string;
  amount: number;
  currency: string;
  order_status: string;
  payment_status: string;
  payment_method?: string | null;
  bank_reference?: string | null;
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("order_id");

  const [isLoading, setIsLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [data, setData] = useState<PaymentStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearCart = useCartStore((s) => s.clearCart);
  const hasClearedCart = useRef(false);

  const MAX_POLLS = 5;
  const POLL_INTERVAL_MS = 2000;

  const fetchStatus = useCallback(
    async (isManual = false) => {
      if (!orderIdParam) {
        setError("No order reference provided in return URL.");
        setIsLoading(false);
        return;
      }

      if (isManual) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const res = await api.get<PaymentStatusData>(
          `/api/payments/order/${encodeURIComponent(orderIdParam)}/status`
        );
        setData(res);

        const isPaid =
          res.payment_status === "paid" ||
          res.status === "paid" ||
          res.order_status === "confirmed";

        if (isPaid && !hasClearedCart.current) {
          hasClearedCart.current = true;
          clearCart();
          setIsLoading(false);
          return;
        }

        const isTerminalFailure =
          res.status === "failed" ||
          res.status === "cancelled" ||
          res.status === "user_dropped";

        if (isTerminalFailure) {
          setIsLoading(false);
          return;
        }

        // If still pending and haven't exceeded poll limit, keep polling
        if (!isPaid && pollCount < MAX_POLLS && !isManual) {
          setTimeout(() => {
            setPollCount((prev) => prev + 1);
          }, POLL_INTERVAL_MS);
        } else {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load payment status.";
        setError(message);
        setIsLoading(false);
      }
    },
    [orderIdParam, pollCount, clearCart]
  );

  useEffect(() => {
    let active = true;
    if (active) {
      void fetchStatus();
    }
    return () => {
      active = false;
    };
  }, [fetchStatus]);

  // 1. Missing Reference State
  if (!orderIdParam) {
    return (
      <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft p-8 max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-green">Order Reference Missing</h1>
          <p className="text-charcoal/70 text-sm mt-2">
            We could not find an order reference in your return link. If you recently completed a payment, please check your account dashboard.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/shop">
            <Button variant="primary" size="md" className="w-full">
              Explore Our Collection
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Initial Loading State
  if (isLoading && !data) {
    return (
      <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft p-10 max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto animate-pulse">
          <Clock className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-green">Verifying Your Payment</h1>
          <p className="text-charcoal/70 text-sm mt-2">
            Please wait while we confirm your payment transaction with your bank. This takes just a moment...
          </p>
        </div>
        <div className="w-full bg-cream-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-gold h-full transition-all duration-500"
            style={{ width: `${Math.min(100, (pollCount + 1) * 20)}%` }}
          />
        </div>
      </div>
    );
  }

  // Determine current status
  const isPaid =
    data?.payment_status === "paid" ||
    data?.status === "paid" ||
    data?.order_status === "confirmed";

  const isFailed =
    data?.status === "failed" ||
    data?.status === "cancelled" ||
    data?.status === "user_dropped";

  // 3. Success State
  if (isPaid && data) {
    return (
      <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft p-8 sm:p-10 max-w-xl w-full text-center space-y-6">
        <div className="relative w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
          <div className="absolute -top-1 -right-1 bg-brand-gold text-white p-1 rounded-full">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div>
          <Badge variant="default" className="mb-3 text-emerald-700 bg-emerald-50 border border-emerald-200">
            Payment Confirmed
          </Badge>
          <h1 className="font-display text-3xl font-bold text-brand-green">Thank You for Your Order!</h1>
          <p className="text-charcoal/70 text-sm mt-2">
            Your payment was securely verified. We are preparing your handcrafted wooden masterpieces for shipment.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-brand-cream/60 rounded-2xl p-5 border border-warmgrey/40 text-left space-y-3">
          <div className="flex justify-between items-center text-sm border-b border-warmgrey/30 pb-2.5">
            <span className="text-charcoal/60">Order Number</span>
            <span className="font-mono font-semibold text-brand-green">{data.order_number}</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-warmgrey/30 pb-2.5">
            <span className="text-charcoal/60">Amount Paid</span>
            <span className="font-display font-bold text-lg text-brand-green">
              ₹{Number(data.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-warmgrey/30 pb-2.5">
            <span className="text-charcoal/60">Payment Method</span>
            <span className="capitalize font-medium text-charcoal">
              {data.payment_method?.replace("_", " ") || "UPI / Net Banking"}
            </span>
          </div>

          {data.bank_reference && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-charcoal/60">Bank Reference (UTR)</span>
              <span className="font-mono text-xs text-charcoal/80">{data.bank_reference}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/shop" className="flex-1">
            <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continue Shopping
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 4. Failed / Cancelled State
  if (isFailed) {
    return (
      <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft p-8 sm:p-10 max-w-xl w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div>
          <Badge variant="default" className="mb-3 text-amber-700 bg-amber-50 border border-amber-200">
            Payment Not Completed
          </Badge>
          <h1 className="font-display text-2xl font-bold text-brand-green">Payment Incomplete or Cancelled</h1>
          <p className="text-charcoal/70 text-sm mt-2">
            The transaction was not completed. Don&apos;t worry—your items are safely preserved in your cart. You can retry with another UPI app or Net Banking.
          </p>
        </div>

        {data && (
          <div className="bg-brand-cream/60 rounded-2xl p-4 border border-warmgrey/40 text-left space-y-2 text-xs text-charcoal/70">
            <div className="flex justify-between">
              <span>Order Reference:</span>
              <span className="font-mono">{data.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-semibold text-amber-700 capitalize">{data.status.replace("_", " ")}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/checkout" className="flex-1">
            <Button variant="primary" size="lg" className="w-full" rightIcon={<RefreshCw className="w-4 h-4" />}>
              Try Payment Again
            </Button>
          </Link>
          <Link href="/shop" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Back to Collection
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 5. Still Pending / Polling Timeout State
  return (
    <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft p-8 sm:p-10 max-w-xl w-full text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
        <Clock className="w-10 h-10" />
      </div>

      <div>
        <Badge variant="default" className="mb-3 text-blue-700 bg-blue-50 border border-blue-200">
          Payment Processing
        </Badge>
        <h1 className="font-display text-2xl font-bold text-brand-green">Confirmation in Progress</h1>
        <p className="text-charcoal/70 text-sm mt-2">
          Your bank or UPI provider has not reported the final outcome yet. As soon as Cashfree confirms your payment, your order will automatically be confirmed.
        </p>
      </div>

      {data && (
        <div className="bg-brand-cream/60 rounded-2xl p-4 border border-warmgrey/40 text-left space-y-2 text-xs text-charcoal/70">
          <div className="flex justify-between">
            <span>Order Reference:</span>
            <span className="font-mono font-medium">{data.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium">₹{Number(data.amount).toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          isLoading={isLoading}
          onClick={() => fetchStatus(true)}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Check Again
        </Button>
        <Link href="/shop" className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            Explore Collection
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <main className="min-h-screen bg-brand-cream flex items-center justify-center p-4 pt-28 pb-16">
      <Suspense
        fallback={
          <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-soft p-10 max-w-lg w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-sm font-medium text-brand-green">Loading payment status...</p>
          </div>
        }
      >
        <PaymentStatusContent />
      </Suspense>
    </main>
  );
}
