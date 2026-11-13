import Link from "next/link";
import Image from "next/image";

// Custom Social SVG icons
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

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const SOCIAL_LINKS = {
  youtube: "https://youtube.com/@dridha_crafts?si=AqfNqP7CNxkKbAtf",
  instagram: "https://www.instagram.com/dridha_crafts?dlrf=ODVtZ2VvZ3Flcng=",
  facebook: "https://www.facebook.com/share/19hvBRRtFT/",
};

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
          {/* Col 1: Brand Description + Social Links */}
          <div className="space-y-5">
            <h4 className="text-xs uppercase font-semibold tracking-[0.25em] text-brand-gold">
              Our Story & Channels
            </h4>
            <p className="text-sm text-brand-cream/70 leading-relaxed font-body">
              Every piece is a blend of nature, tradition, and skilled hands.
              From the fallen trees of Kashmir to your desk, we bring you
              handcrafted wood essentials — made to last a lifetime.
            </p>
            <div className="space-y-2 pt-1">
              <span className="text-[11px] uppercase tracking-wider text-brand-cream/40 block">
                Follow & Subscribe:
              </span>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-red-500/30 bg-red-600/10 text-brand-cream/80 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-300 text-xs font-medium"
                  aria-label="Subscribe to Dridha Crafts on YouTube"
                >
                  <YouTubeIcon className="w-3.5 h-3.5 text-red-500 group-hover:text-white transition-colors" />
                  YouTube
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 text-brand-cream/80 hover:text-charcoal hover:bg-brand-gold hover:border-brand-gold transition-all duration-300 text-xs font-medium"
                  aria-label="Follow Dridha Crafts on Instagram"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-brand-gold group-hover:text-charcoal transition-colors" />
                  Instagram
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-blue-500/30 bg-blue-600/10 text-brand-cream/80 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 text-xs font-medium"
                  aria-label="Connect with Dridha Crafts on Facebook"
                >
                  <FacebookIcon className="w-3.5 h-3.5 text-blue-400 group-hover:text-white transition-colors" />
                  Facebook
                </a>
              </div>
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
