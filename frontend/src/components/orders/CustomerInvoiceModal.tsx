"use client";

import { Printer, X, Download, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import type { Order } from "@/types/order";

interface CustomerInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function CustomerInvoiceModal({
  isOpen,
  onClose,
  order,
}: CustomerInvoiceModalProps) {
  if (!isOpen || !order) return null;

  const fmt = (amt?: number) => `₹${Number(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const fmtDate = (d?: string) => {
    if (!d) return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="bg-white rounded-3xl border border-warmgrey/70 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Header - Screen only */}
        <div className="p-4 sm:p-5 border-b border-warmgrey/50 bg-stone-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-charcoal">
                Order Receipt &amp; Tax Invoice
              </h3>
              <p className="text-xs text-charcoal/60">
                Official retail invoice for Order #{order.order_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-brand-green hover:bg-brand-green/90 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-200 text-charcoal/60 hover:text-charcoal flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-black font-sans print:p-0">
          {/* Top Brand Bar */}
          <div className="border-b-2 border-black pb-4 flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wider uppercase">
                  DRIDHA CRAFTS
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">
                Handmade in the Kashmir Valley
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Atelier: Srinagar, Jammu &amp; Kashmir, India — 190001
              </p>
              <p className="text-xs text-gray-600">
                Email: craftsdridha@gmail.com | WhatsApp: +91 97678 07889
              </p>
            </div>

            <div className="text-right">
              <span className="bg-black text-white text-xs font-black px-3 py-1 rounded-xs tracking-wider uppercase inline-block mb-1">
                TAX INVOICE
              </span>
              <div className="font-mono font-bold text-sm text-gray-900">
                INV-{order.order_number}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                Date: {fmtDate(order.created_at)}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold uppercase mt-1">
                ✓ {order.payment_status}
              </div>
            </div>
          </div>

          {/* Customer & Shipping Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 border-b border-gray-200 pb-6 text-xs">
            <div>
              <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px] mb-1">
                BILLED &amp; DELIVERED TO:
              </span>
              <div className="font-bold text-sm text-gray-900">{order.shipping_name}</div>
              <div className="text-gray-700 mt-1 leading-relaxed">
                {[order.shipping_address_line_1, order.shipping_address_line_2]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              <div className="text-gray-900 font-medium mt-0.5">
                {order.shipping_city}, {order.shipping_state} —{" "}
                <strong className="font-mono font-bold">{order.shipping_pincode}</strong>
              </div>
              {order.shipping_phone && (
                <div className="text-gray-800 font-semibold mt-1">
                  Phone: +91 {order.shipping_phone}
                </div>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px] mb-1">
                ORDER &amp; PAYMENT DETAILS:
              </span>
              <div>
                <span className="text-gray-600">Order ID: </span>
                <strong className="font-mono">{order.order_number}</strong>
              </div>
              <div>
                <span className="text-gray-600">Payment Mode: </span>
                <strong className="uppercase">{(order.payment_method || "prepaid").replace("_", " ")}</strong>
              </div>
              {order.tracking_number && (
                <div>
                  <span className="text-gray-600">Tracking (AWB): </span>
                  <strong className="font-mono">{order.tracking_number}</strong>
                  {order.carrier && <span className="text-gray-500"> ({order.carrier})</span>}
                </div>
              )}
              <div className="text-[11px] text-gray-500 pt-1">
                Place of Supply: Jammu &amp; Kashmir (State Code: 01)
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="my-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-black text-gray-800 font-bold uppercase text-[11px]">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center w-16">Qty</th>
                  <th className="py-2.5 text-right w-24">Unit Price</th>
                  <th className="py-2.5 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-3 pr-4">
                      <div className="font-bold text-gray-900 text-sm">{it.product_name}</div>
                      <div className="text-[11px] text-gray-600">
                        Crafted from Naturally Fallen Kashmir Pine
                        {it.variant_name ? ` • Finish: ${it.variant_name}` : ""}
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono font-medium">{it.quantity}</td>
                    <td className="py-3 text-right font-mono">{fmt(it.price)}</td>
                    <td className="py-3 text-right font-mono font-bold">{fmt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Sustainability Note */}
          <div className="border-t-2 border-black pt-4 grid grid-cols-1 sm:grid-cols-12 gap-6 text-xs">
            <div className="sm:col-span-7 space-y-3">
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-gray-700 leading-relaxed text-[11px]">
                <strong className="block font-bold text-gray-900 mb-0.5">
                  Artisanal Sustainability Pledge:
                </strong>
                Every Dridha Crafts accessory is handcrafted from naturally fallen pine wood in the Kashmir Valley. No green trees are harmed.
              </div>

              <div className="text-[11px] text-gray-600 leading-relaxed">
                <strong>Care Instructions:</strong> Clean gently with a dry or lightly oiled microfiber cloth. Avoid continuous water soaking.
              </div>
            </div>

            <div className="sm:col-span-5 text-right space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">{fmt(order.subtotal || order.total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping &amp; Packaging:</span>
                <span className="font-semibold text-emerald-700 uppercase">FREE</span>
              </div>
              <div className="flex justify-between text-base font-black border-t-2 border-black pt-2 text-black">
                <span>Total Paid:</span>
                <span className="font-mono text-lg">{fmt(order.total)}</span>
              </div>
              <div className="text-[11px] text-gray-500 italic">
                (Inclusive of all applicable GST &amp; taxes)
              </div>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="border-t border-gray-300 mt-8 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-3">
            <div>
              This is a computer generated invoice. No physical signature required.
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800">For Dridha Crafts</div>
              <div className="text-[11px] text-gray-600">Authorized Atelier Signatory</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Screen only) */}
        <div className="p-4 border-t border-warmgrey/50 bg-stone-50 flex items-center justify-between print:hidden">
          <span className="text-xs text-charcoal/60">
            Need help with this order? Contact WhatsApp at <strong>+91 97678 07889</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-warmgrey/80 text-charcoal text-xs font-semibold hover:bg-stone-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
