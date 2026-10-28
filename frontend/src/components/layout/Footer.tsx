import Link from "next/link";
import Image from "next/image";

// Custom Instagram SVG icon
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-charcoal text-brand-cream relative overflow-hidden border-t border-white/5">
      {/* Decorative Kashmir mountain silhouette */}
      <div className="w-full opacity-10 overflow-hidden pointer-events-none select-none">
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="w-full h-16 sm:h-20 fill-brand-gold/30 stroke-brand-gold"
          strokeWidth="0.5"
        >
          <path d="M0,80 L0,55 L80,30 L160,55 L240,20 L320,50 L400,15 L480,45 L560,25 L640,55 L720,30 L800,60 L880,35 L960,58 L1040,28 L1120,52 L1200,38 L1280,62 L1360,42 L1440,58 L1440,80 Z" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pb-12 lg:pb-16">
        {/* Top: Logo + Tagline */}
        <div className="text-center pb-12 border-b border-white/10 mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-brand-gold/40 shadow-elevated">
              <Image
                src="/images/logo.jpg"
                alt="Dridha Crafts Logo"
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="text-left">
              <h3 className="font-display text-3xl font-bold tracking-widest text-brand-gold">
                DRIDHA CRAFTS
              </h3>
              <p className="text-[10px] tracking-[0.3em] uppercase text-brand-cream/50 mt-0.5">
                Kashmir Valley · Est. 2026
              </p>
            </div>
          </div>
          <p className="font-accent text-brand-gold text-xl mt-2">
            Crafted with care, just for you.
          </p>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 mb-12">
          {/* Col 1: Brand Description + Social */}
          <div className="space-y-5">
            <h4 className="text-xs uppercase font-semibold tracking-[0.25em] text-brand-gold">
              Our Story
            </h4>
            <p className="text-sm text-brand-cream/70 leading-relaxed font-body">
              Every piece is a blend of nature, tradition, and skilled hands.
              From the fallen trees of Kashmir to your desk, we bring you
              handcrafted wood essentials — made to last a lifetime.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://instagram.com/dridhacrafts"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-brand-gold/30 text-brand-cream/70 hover:text-brand-gold hover:border-brand-gold transition-all duration-300 text-xs font-medium"
                aria-label="Follow Dridha Crafts on Instagram"
              >
                <InstagramIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                @dridhacrafts
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-5">
            <h4 className="text-xs uppercase font-semibold tracking-[0.25em] text-brand-gold">
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm text-brand-cream/70">
              <li>
                <Link
                  href="/"
                  className="hover:text-brand-gold hover:pl-1 transition-all duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="hover:text-brand-gold hover:pl-1 transition-all duration-200"
                >
                  Collection
                </Link>
              </li>
              <li>
                <Link
                  href="/story"
                  className="hover:text-brand-gold hover:pl-1 transition-all duration-200"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/#process"
                  className="hover:text-brand-gold hover:pl-1 transition-all duration-200"
                >
                  Craftsmanship
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="hover:text-brand-gold hover:pl-1 transition-all duration-200"
                >
                  My Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact + Payment */}
          <div className="space-y-5">
            <h4 className="text-xs uppercase font-semibold tracking-[0.25em] text-brand-gold">
              Contact & Payments
            </h4>
            <div className="space-y-3 text-sm text-brand-cream/70">
              <p className="flex items-start gap-2">
                <span className="text-brand-gold mt-0.5">✉</span>
                <span>hello@dridhacrafts.com</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-brand-gold mt-0.5">📍</span>
                <span>Shipped from Pune · Made in Kashmir</span>
              </p>
            </div>
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-brand-cream/50 mb-3 uppercase tracking-wider">
                We accept
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-brand-cream/70 font-medium">
                  <span>📱</span> GPay QR
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-brand-cream/70 font-medium">
                  <span>💵</span> Cash on Delivery
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-brand-cream/70 font-medium">
                  <span>🚚</span> Free Shipping
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-cream/40 gap-3">
          <p>© 2026 Dridha Crafts. All rights reserved.</p>
          <p className="text-center">
            Crafted with ❤️ in Kashmir &amp; Pune
          </p>
          <p className="text-right text-brand-cream/30">
            Zero Deforestation · Pure Craft
          </p>
        </div>
      </div>
    </footer>
  );
}
