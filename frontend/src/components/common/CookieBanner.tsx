"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("dridha_privacy_consent");
      if (!consent) {
        // Small delay so it animates in smoothly after page loads
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case localStorage is blocked
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("dridha_privacy_consent", "accepted");
    } catch {
      // Ignore
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div className="bg-charcoal/95 backdrop-blur-md text-brand-cream border border-brand-gold/30 rounded-2xl p-4 sm:p-5 shadow-elevated flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white tracking-wide">
              Privacy &amp; Essential Storage
            </p>
            <p className="text-[12px] text-brand-cream/80 leading-relaxed font-body">
              We use essential cookies and local storage to preserve your shopping bag and provide secure login. By using our website, you agree to our{" "}
              <Link
                href="/privacy"
                className="text-brand-gold font-medium underline hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="text-brand-gold font-medium underline hover:text-white transition-colors"
              >
                Terms
              </Link>.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-lg bg-brand-gold hover:bg-[#d4b378] text-charcoal font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
