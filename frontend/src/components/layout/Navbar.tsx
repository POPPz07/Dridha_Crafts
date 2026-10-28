"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User as UserIcon, X, Heart, Menu } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useWishlistStore } from "@/stores/wishlistStore";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Our Story", href: "/story" },
  { label: "Kashmir", href: "/story#kashmir" },
  { label: "Help", href: "/help" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const totalCartItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const wishlistCount = useWishlistStore((s) => s.productIds.length);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Always a dark-green frosted bar — readable over every section.
  // On scroll: fully opaque + tighter shadow. At top: slightly more transparent.
  const headerBg = isScrolled
    ? "bg-[#0e2a1e]/95 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.06)] border-b border-white/8"
    : "bg-[#0e2a1e]/80 backdrop-blur-sm";

  const linkClass =
    "text-[11px] font-bold tracking-[0.18em] uppercase text-white/75 hover:text-[#e5c89d] transition-colors duration-200";

  const iconClass =
    "p-2.5 rounded-full text-white/75 hover:text-[#e5c89d] hover:bg-white/10 transition-colors duration-200";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${headerBg} ${
        isScrolled ? "py-2.5" : "py-4"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Desktop: Logo LEFT · Nav CENTER · Icons RIGHT ── */}
        <div className="hidden lg:grid grid-cols-3 items-center">

          {/* LEFT — Logo */}
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#e5c89d]/30 shadow-sm flex-shrink-0">
              <Image
                src="/images/logo.jpg"
                alt="Dridha Crafts Logo"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="36px"
                priority
              />
            </div>
            <div>
              <span className="block font-display text-[17px] font-bold tracking-tight leading-none text-white group-hover:text-[#e5c89d] transition-colors duration-300">
                DRIDHA CRAFTS
              </span>
              <span className="block text-[8px] uppercase tracking-[0.22em] text-[#e5c89d]/70 font-semibold mt-0.5">
                Kashmir Valley
              </span>
            </div>
          </Link>

          {/* CENTER — Navigation */}
          <nav className="flex items-center justify-center gap-6 xl:gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT — Icons */}
          <div className="flex items-center justify-end gap-0.5">
            {/* Wishlist */}
            <Link href="/wishlist" className={`relative ${iconClass}`} aria-label="Wishlist">
              <Heart className="w-[18px] h-[18px]" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-[#e5c89d] text-[#0e2a1e] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <button
              onClick={() => openAuthModal(user ? undefined : "login")}
              className={iconClass}
              aria-label="Account"
            >
              <UserIcon className="w-[18px] h-[18px]" />
            </button>

            {/* Cart */}
            <button onClick={toggleCart} className={`relative ${iconClass}`} aria-label="Cart">
              <ShoppingBag className="w-[18px] h-[18px]" />
              {mounted && totalCartItems > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-brand-gold text-[#0e2a1e] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none animate-scale-in">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile ─────────────────────────────────────────── */}
        <div className="flex lg:hidden items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#e5c89d]/30">
              <Image src="/images/logo.jpg" alt="Dridha Crafts" fill className="object-cover" sizes="32px" priority />
            </div>
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              DRIDHA CRAFTS
            </span>
          </Link>

          <div className="flex items-center gap-0.5">
            <button onClick={toggleCart} className={`relative ${iconClass}`} aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {mounted && totalCartItems > 0 && (
                <span className="absolute top-1 right-1 bg-brand-gold text-[#0e2a1e] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={iconClass}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0e2a1e]/98 backdrop-blur-lg border-t border-white/10 px-6 py-6 animate-fade-in">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold uppercase tracking-wider text-white/80 hover:text-[#e5c89d] py-3.5 border-b border-white/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-5 pt-5">
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-[#e5c89d]"
              >
                <Heart className="w-4 h-4" /> Wishlist
                {mounted && wishlistCount > 0 && (
                  <span className="bg-[#e5c89d] text-[#0e2a1e] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => { openAuthModal(user ? undefined : "login"); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-[#e5c89d]"
              >
                <UserIcon className="w-4 h-4" /> Account
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
