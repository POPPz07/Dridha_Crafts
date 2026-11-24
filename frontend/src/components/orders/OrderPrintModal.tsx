"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  X,
  Package,
  FileText,
  Copy,
  Scissors,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";

export type PrintableOrder = {
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
  created_at?: string;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
};

type PrintMode = "dual_pair" | "shipping_only" | "invoice_only";
type LayoutMode = "2_per_page" | "4_per_page" | "1_full_page";

interface OrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PrintableOrder[];
}

export default function OrderPrintModal({
  isOpen,
  onClose,
  orders,
}: OrderPrintModalProps) {
  const [mounted, setMounted] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("dual_pair");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("2_per_page");
  const [copiesPerOrder, setCopiesPerOrder] = useState<number>(2);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("printing-modal");
      return () => {
        document.body.classList.remove("printing-modal");
      };
    }
  }, [isOpen]);

  // Format currency
  const fmt = (amt?: number) => `₹${Number(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  // Format date
  const fmtDate = (d?: string) => {
    if (!d) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Build list of all slips to render
  const queuedSlips = useMemo(() => {
    const slips: { order: PrintableOrder; slipType: "shipping" | "invoice"; copyIndex: number }[] = [];

    orders.forEach((ord) => {
      if (printMode === "dual_pair") {
        // Dual pair: 1 shipping label + 1 tax invoice = 2 slips per set
        const sets = Math.max(1, Math.floor(copiesPerOrder / 2) || 1);
        for (let i = 0; i < sets; i++) {
          slips.push({ order: ord, slipType: "shipping", copyIndex: i + 1 });
          slips.push({ order: ord, slipType: "invoice", copyIndex: i + 1 });
        }
      } else if (printMode === "shipping_only") {
        for (let i = 0; i < copiesPerOrder; i++) {
          slips.push({ order: ord, slipType: "shipping", copyIndex: i + 1 });
        }
      } else {
        for (let i = 0; i < copiesPerOrder; i++) {
          slips.push({ order: ord, slipType: "invoice", copyIndex: i + 1 });
        }
      }
    });

    return slips;
  }, [orders, printMode, copiesPerOrder]);

  // Determine items per page
  const slipsPerPage = layoutMode === "4_per_page" ? 4 : layoutMode === "2_per_page" ? 2 : 1;

  // Chunk slips into A4 pages
  const a4Pages = useMemo(() => {
    const pages: (typeof queuedSlips)[] = [];
    for (let i = 0; i < queuedSlips.length; i += slipsPerPage) {
      pages.push(queuedSlips.slice(i, i + slipsPerPage));
    }
    return pages;
  }, [queuedSlips, slipsPerPage]);

  if (!isOpen || orders.length === 0 || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div id="printable-modal-root" className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* ── Screen Dialog Container (Hidden on Print) ── */}
      <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden print-screen-only print:hidden" data-print-screen-only="true">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-warmgrey/50 bg-stone-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-green text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-charcoal">
                  A4 Slip &amp; Invoice Generator
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-green/10 text-brand-green border border-brand-green/20">
                  {orders.length} {orders.length === 1 ? "Order" : "Orders"} Selected
                </span>
              </div>
              <p className="text-xs text-charcoal/60 mt-0.5">
                Formatted for regular A4 home/office printers with instant scissors cut-lines.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-stone-200/70 text-charcoal/60 hover:text-charcoal flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-warmgrey/40 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Slip Type Selection */}
          <div className="space-y-1">
            <label className="font-semibold text-charcoal/70 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-green" />
              Document Style
            </label>
            <select
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as PrintMode)}
              className="w-full bg-stone-50 border border-warmgrey/70 rounded-xl px-3 py-2 text-charcoal font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="dual_pair">Dual Pair (1 Outside + 1 Inside)</option>
              <option value="shipping_only">Shipping Box Labels Only</option>
              <option value="invoice_only">Tax Invoices / Receipts Only</option>
            </select>
          </div>

          {/* Slips Per A4 Sheet */}
          <div className="space-y-1">
            <label className="font-semibold text-charcoal/70 flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-brand-green" />
              A4 Page Layout
            </label>
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
              className="w-full bg-stone-50 border border-warmgrey/70 rounded-xl px-3 py-2 text-charcoal font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="2_per_page">2 Slips per A4 (A5 - Half Page)</option>
              <option value="4_per_page">4 Slips per A4 (A6 - Quadrants)</option>
              <option value="1_full_page">1 Slip per A4 (Full Page)</option>
            </select>
          </div>

          {/* Copies Stepper */}
          <div className="space-y-1">
            <label className="font-semibold text-charcoal/70 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-green" />
              Copies per Order
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCopiesPerOrder((c) => Math.max(1, c - 1))}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-charcoal font-bold flex items-center justify-center border border-warmgrey/60"
              >
                -
              </button>
              <span className="font-bold text-charcoal text-sm min-w-8 text-center font-mono">
                {copiesPerOrder}
              </span>
              <button
                type="button"
                onClick={() => setCopiesPerOrder((c) => Math.min(8, c + 1))}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-charcoal font-bold flex items-center justify-center border border-warmgrey/60"
              >
                +
              </button>
              <span className="text-[11px] text-charcoal/50">
                {printMode === "dual_pair" ? "(1 out + 1 in)" : "copies"}
              </span>
            </div>
          </div>

          {/* Cut Lines Toggle */}
          <div className="space-y-1 flex flex-col justify-end">
            <label className="font-semibold text-charcoal/70 flex items-center gap-1.5 mb-1.5">
              <Scissors className="w-3.5 h-3.5 text-brand-green" />
              Scissors Cut Guides
            </label>
            <button
              type="button"
              onClick={() => setShowCutLines(!showCutLines)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                showCutLines
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-stone-50 text-charcoal/60 border-warmgrey/60"
              }`}
            >
              {showCutLines ? <Check className="w-3.5 h-3.5" /> : null}
              {showCutLines ? "Cut Lines Enabled" : "No Cut Lines"}
            </button>
          </div>
        </div>

        {/* Live Calculation Summary Banner */}
        <div className="bg-brand-cream/60 px-6 py-2.5 border-b border-warmgrey/40 flex flex-wrap items-center justify-between text-xs text-charcoal/70">
          <div className="flex items-center gap-4">
            <span>
              Orders: <strong className="text-charcoal font-bold">{orders.length}</strong>
            </span>
            <span>•</span>
            <span>
              Total Slips Queued:{" "}
              <strong className="text-charcoal font-bold">{queuedSlips.length}</strong>
            </span>
            <span>•</span>
            <span>
              A4 Sheets Needed:{" "}
              <strong className="text-brand-green font-bold text-sm">
                {a4Pages.length} {a4Pages.length === 1 ? "Page" : "Pages"}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal/50 italic">
            *High-contrast black &amp; white layout to save colored printer ink.
          </span>
        </div>

        {/* Interactive Print Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100/60 space-y-6">
          {a4Pages.map((pageSlips, pageIdx) => (
            <div
              key={pageIdx}
              className="bg-white rounded-xl shadow-md border border-stone-300 max-w-[210mm] mx-auto overflow-hidden p-6 relative"
              style={{ minHeight: "297mm", aspectRatio: "210 / 297" }}
            >
              <div className="absolute top-2 right-3 text-[10px] font-mono text-stone-400">
                A4 Sheet {pageIdx + 1} of {a4Pages.length}
              </div>

              <div
                className={`h-full grid ${
                  layoutMode === "4_per_page"
                    ? "grid-cols-2 grid-rows-2 gap-4"
                    : layoutMode === "2_per_page"
                    ? "grid-cols-1 grid-rows-2 gap-6"
                    : "grid-cols-1 gap-4"
                }`}
              >
                {pageSlips.map((slip, sIdx) => (
                  <div key={sIdx} className="relative h-full flex flex-col justify-between">
                    {/* Render Slip Content */}
                    {slip.slipType === "shipping" ? (
                      <ShippingBoxSlip order={slip.order} layoutMode={layoutMode} />
                    ) : (
                      <TaxInvoiceSlip order={slip.order} layoutMode={layoutMode} />
                    )}

                    {/* Scissor Cut Line Guide (Between items) */}
                    {showCutLines && sIdx < pageSlips.length - 1 && layoutMode === "2_per_page" && (
                      <div className="absolute -bottom-3 left-0 right-0 flex items-center justify-center text-stone-400 text-[10px] font-mono">
                        <span className="bg-white px-2 flex items-center gap-1.5 border border-dashed border-stone-300 rounded-full py-0.5">
                          <Scissors className="w-3 h-3 text-stone-500" />
                          Cut Along Line (A5 Half Sheet)
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-warmgrey/50 bg-white flex items-center justify-between gap-4">
          <div className="text-xs text-charcoal/60">
            Tip: In the print dialog, ensure Destination is set to <strong>Save as PDF</strong> or select your printer.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-warmgrey/80 text-charcoal text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Printer className="w-4 h-4" />
              Print {a4Pages.length} A4 {a4Pages.length === 1 ? "Page" : "Pages"} Now
            </button>
          </div>
        </div>
      </div>

      {/* ── Native Print Engine Output (Visible ONLY when printing) ── */}
      <div className="hidden print:block w-full">
        {a4Pages.map((pageSlips, pageIdx) => (
          <div
            key={pageIdx}
            className="print-page w-full p-2"
            style={{
              pageBreakAfter: pageIdx < a4Pages.length - 1 ? "always" : "auto",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              className={`h-full grid ${
                layoutMode === "4_per_page"
                  ? "grid-cols-2 grid-rows-2 gap-4"
                  : layoutMode === "2_per_page"
                  ? "grid-cols-1 grid-rows-2 gap-6"
                  : "grid-cols-1 gap-4"
              }`}
            >
              {pageSlips.map((slip, sIdx) => (
                <div key={sIdx} className="relative flex flex-col justify-between">
                  {slip.slipType === "shipping" ? (
                    <ShippingBoxSlip order={slip.order} layoutMode={layoutMode} />
                  ) : (
                    <TaxInvoiceSlip order={slip.order} layoutMode={layoutMode} />
                  )}

                  {showCutLines && sIdx < pageSlips.length - 1 && layoutMode === "2_per_page" && (
                    <div className="py-2 text-center text-[9px] text-gray-500 font-mono border-b border-dashed border-gray-400">
                      ✂ - - - - - - - - - - - - - - - - Cut Along Line (A5 Half) - - - - - - - - - - - - - - - - ✂
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Global CSS for Print Media */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
          }
          body.printing-modal > *:not(#printable-modal-root),
          body:has(#printable-modal-root) > *:not(#printable-modal-root) {
            display: none !important;
            visibility: hidden !important;
          }
          #printable-modal-root {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
          .print-screen-only,
          [data-print-screen-only="true"] {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIP 1: Outer Shipping Box Label (Stick on Packaging Box)
// ─────────────────────────────────────────────────────────────────────────────
function ShippingBoxSlip({
  order,
  layoutMode,
}: {
  order: PrintableOrder;
  layoutMode: LayoutMode;
}) {
  const isCompact = layoutMode === "4_per_page";

  return (
    <div className="border-2 border-black rounded-lg p-3 sm:p-4 text-black bg-white flex flex-col justify-between h-full font-sans">
      {/* Label Top Bar */}
      <div className="border-b-2 border-black pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Dridha Pine Icon */}
          <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs">
            ▲
          </div>
          <div>
            <h4 className="font-extrabold tracking-wider text-xs sm:text-sm uppercase leading-none">
              DRIDHA CRAFTS
            </h4>
            <span className="text-[9px] font-semibold text-gray-700 tracking-tight">
              Handmade in the Kashmir Valley
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono font-bold block">
            #{order.order_number}
          </span>
          <span className="text-[9px] text-gray-600 block uppercase font-semibold">
            {order.payment_method === "cod" ? "CASH ON DELIVERY" : "PREPAID / VERIFIED"}
          </span>
        </div>
      </div>

      {/* Courier Delivery Core: SHIP TO & FROM */}
      <div className="grid grid-cols-12 gap-2 my-2 flex-1">
        {/* SHIP TO (7 Cols) */}
        <div className="col-span-8 border-r border-black pr-2 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 tracking-wider block">
              DELIVER TO (SHIP TO):
            </span>
            <div className="font-black text-sm sm:text-base leading-tight mt-0.5">
              {order.shipping_name}
            </div>
            <div className="text-[11px] leading-tight mt-1 text-gray-800">
              {[order.shipping_address_line_1, order.shipping_address_line_2]
                .filter(Boolean)
                .join(", ")}
            </div>
            <div className="text-[11px] font-bold text-gray-900 mt-0.5">
              {order.shipping_city}, {order.shipping_state}
            </div>
          </div>

          {/* Large Bold Pincode & Mobile */}
          <div className="mt-2 pt-1 border-t border-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold">PIN:</span>
              <span className="font-mono font-black text-base sm:text-lg bg-black text-white px-2 py-0.5 rounded-sm tracking-widest">
                {order.shipping_pincode}
              </span>
            </div>
            <div className="text-[11px] font-bold mt-1 text-gray-900">
              📞 +91 {order.shipping_phone}
            </div>
          </div>
        </div>

        {/* FROM / SENDER (4 Cols) */}
        <div className="col-span-4 pl-1 flex flex-col justify-between text-[10px] leading-tight">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 tracking-wider block">
              RETURN / SENDER:
            </span>
            <strong className="block text-[11px] font-bold mt-0.5">Dridha Crafts</strong>
            <span className="text-gray-800 block">Sun City Area, Anand Nagar</span>
            <span className="text-gray-800 block">Sinhgad Road, Pune, Maharashtra</span>
            <span className="font-mono font-bold block mt-0.5">PIN: 411051</span>
            <span className="text-gray-800 block mt-0.5">Ph: +91 97678 07889</span>
          </div>

          {/* Visual Barcode Pattern */}
          <div className="mt-2 text-center pt-1 border-t border-gray-200">
            <svg
              className="w-full h-7 mx-auto"
              viewBox="0 0 100 24"
              preserveAspectRatio="none"
              shapeRendering="crispEdges"
            >
              {/* Authentic barcode bars */}
              <rect x="2" y="0" width="3" height="24" fill="black" />
              <rect x="7" y="0" width="1" height="24" fill="black" />
              <rect x="10" y="0" width="4" height="24" fill="black" />
              <rect x="16" y="0" width="2" height="24" fill="black" />
              <rect x="20" y="0" width="1" height="24" fill="black" />
              <rect x="23" y="0" width="5" height="24" fill="black" />
              <rect x="30" y="0" width="2" height="24" fill="black" />
              <rect x="34" y="0" width="3" height="24" fill="black" />
              <rect x="39" y="0" width="1" height="24" fill="black" />
              <rect x="42" y="0" width="4" height="24" fill="black" />
              <rect x="48" y="0" width="2" height="24" fill="black" />
              <rect x="52" y="0" width="3" height="24" fill="black" />
              <rect x="57" y="0" width="1" height="24" fill="black" />
              <rect x="60" y="0" width="4" height="24" fill="black" />
              <rect x="66" y="0" width="2" height="24" fill="black" />
              <rect x="70" y="0" width="5" height="24" fill="black" />
              <rect x="77" y="0" width="2" height="24" fill="black" />
              <rect x="81" y="0" width="1" height="24" fill="black" />
              <rect x="84" y="0" width="4" height="24" fill="black" />
              <rect x="90" y="0" width="2" height="24" fill="black" />
              <rect x="94" y="0" width="3" height="24" fill="black" />
            </svg>
            <span className="font-mono text-[8px] tracking-wider font-semibold block text-gray-700">
              *{order.order_number}*
            </span>
          </div>
        </div>
      </div>

      {/* Package Contents Checklist */}
      <div className="bg-gray-100 rounded-sm p-1.5 border border-gray-300 text-[10px] my-1">
        <span className="font-bold text-gray-700 uppercase tracking-tight block mb-0.5">
          Package Contents Checklist:
        </span>
        <div className="space-y-0.5 max-h-12 overflow-hidden font-medium">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between items-center text-gray-900 leading-tight">
              <span className="truncate pr-2">
                [ ] {it.product_name}
              </span>
              <span className="font-bold whitespace-nowrap">× {it.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fragile Banner Warning */}
      <div className="border border-black bg-black text-white text-center py-1 rounded-sm mt-1">
        <span className="font-black text-[10px] tracking-wider uppercase flex items-center justify-center gap-1">
          ⚠️ FRAGILE — 100% HANDCRAFTED KASHMIR PINEWOOD — HANDLE WITH CARE ⚠️
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIP 2: Standard Formal Tax Invoice / Packing Slip (Put Inside Box)
// ─────────────────────────────────────────────────────────────────────────────
function TaxInvoiceSlip({
  order,
  layoutMode,
}: {
  order: PrintableOrder;
  layoutMode: LayoutMode;
}) {
  const fmt = (amt?: number) => `₹${Number(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="border-2 border-black rounded-lg p-3 sm:p-4 text-black bg-white flex flex-col justify-between h-full font-sans">
      {/* Invoice Top Header */}
      <div className="border-b-2 border-black pb-2 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base tracking-wider uppercase">DRIDHA CRAFTS</span>
          </div>
          <span className="text-[9px] text-gray-700 block font-semibold leading-tight">
            Handcrafted Wooden Accessories • Kashmir Valley, Srinagar
          </span>
          <span className="text-[9px] text-gray-600 block leading-tight">
            Email: craftsdridha@gmail.com | WhatsApp: +91 97678 07889
          </span>
        </div>
        <div className="text-right">
          <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-xs tracking-wider uppercase block mb-0.5">
            RETAIL INVOICE
          </span>
          <span className="font-mono font-bold text-xs block">
            INV-{order.order_number}
          </span>
          <span className="text-[9px] text-gray-600 block">
            Date: {new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Bill To & Order Summary */}
      <div className="grid grid-cols-2 gap-2 my-2 border-b border-gray-300 pb-2 text-[10px]">
        <div>
          <span className="text-gray-500 font-bold uppercase tracking-wider block text-[8px]">
            CUSTOMER (BILLED TO / SHIP TO):
          </span>
          <div className="font-bold text-xs">{order.shipping_name}</div>
          <div className="text-gray-800 leading-tight">
            {[order.shipping_address_line_1, order.shipping_address_line_2].filter(Boolean).join(", ")}
          </div>
          <div className="text-gray-800 font-medium">
            {order.shipping_city}, {order.shipping_state} — <strong className="font-mono">{order.shipping_pincode}</strong>
          </div>
          <div className="font-bold text-gray-900 mt-0.5">Phone: +91 {order.shipping_phone}</div>
        </div>

        <div className="text-right leading-tight">
          <span className="text-gray-500 font-bold uppercase tracking-wider block text-[8px]">
            PAYMENT &amp; LOGISTICS:
          </span>
          <div className="font-bold text-gray-900 mt-0.5 uppercase">
            Payment: {(order.payment_method || "prepaid").replace("_", " ")}
          </div>
          <div className="text-emerald-700 font-bold uppercase text-[9px]">
            Status: {order.payment_status}
          </div>
          {order.tracking_number && (
            <div className="mt-1 font-mono text-[9px] text-gray-700">
              AWB: {order.tracking_number} {order.carrier ? `(${order.carrier})` : ""}
            </div>
          )}
          <div className="text-gray-500 text-[8px] mt-1">Place of Supply: J&amp;K (01)</div>
        </div>
      </div>

      {/* Itemized Products Table */}
      <div className="flex-1 my-1">
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-black text-gray-700 font-bold uppercase text-[8px]">
              <th className="py-1">Description</th>
              <th className="py-1 text-center w-12">Qty</th>
              <th className="py-1 text-right w-16">Price</th>
              <th className="py-1 text-right w-16">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.map((it) => (
              <tr key={it.id}>
                <td className="py-1 pr-2">
                  <span className="font-bold text-gray-900 block leading-tight">{it.product_name}</span>
                  <span className="text-[8px] text-gray-500">Naturally Fallen Kashmir Pine</span>
                </td>
                <td className="py-1 text-center font-mono font-medium">{it.quantity}</td>
                <td className="py-1 text-right font-mono">{fmt(it.unit_price)}</td>
                <td className="py-1 text-right font-mono font-bold">{fmt(it.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculations & Total */}
      <div className="border-t-2 border-black pt-1.5 flex justify-between items-end text-[10px]">
        {/* Artisan Authenticity Pledge */}
        <div className="max-w-[62%] text-[8px] leading-tight text-gray-600">
          <strong className="text-gray-800 block mb-0.5">Artisanal Sustainability Pledge:</strong>
          Handcrafted from naturally fallen Kashmir pine trees. No living trees were harmed. 
          Keep away from direct water; clean with a soft dry cloth.
        </div>

        {/* Totals Box */}
        <div className="text-right space-y-0.5 min-w-32">
          {order.subtotal && order.subtotal !== order.total && (
            <div className="flex justify-between text-gray-600 text-[9px]">
              <span>Subtotal:</span>
              <span className="font-mono">{fmt(order.subtotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600 text-[9px]">
            <span>Shipping:</span>
            <span className="font-mono font-bold text-gray-900">
              {Number(order.shipping_cost ?? (order.subtotal ? order.total - order.subtotal : 39)) > 0
                ? fmt(order.shipping_cost ?? (order.subtotal ? order.total - order.subtotal : 39))
                : "FREE"}
            </span>
          </div>
          <div className="flex justify-between font-black text-xs sm:text-sm border-t border-black pt-1 text-black">
            <span>Grand Total:</span>
            <span className="font-mono">{fmt(order.total)}</span>
          </div>
          <span className="text-[8px] text-gray-500 block italic leading-none pt-0.5">
            (Includes all local taxes)
          </span>
        </div>
      </div>

      {/* Signatory Footer */}
      <div className="border-t border-gray-300 mt-1.5 pt-1 flex justify-between items-center text-[8px] text-gray-500">
        <span>Dridha Crafts • dridhacrafts.co.in</span>
        <span className="font-medium text-gray-700">Authorised Signatory (Dridha Crafts Atelier)</span>
      </div>
    </div>
  );
}
