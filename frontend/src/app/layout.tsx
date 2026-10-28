import type { Metadata } from "next";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ScrollAnimationProvider } from "@/components/providers/ScrollAnimationProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { CustomCursor } from "@/components/ui/CustomCursor";

export const metadata: Metadata = {
  title: {
    default: "Dridha Crafts — Handmade in the Kashmir Valley",
    template: "%s | Dridha Crafts",
  },
  description:
    "Handcrafted wooden desk accessories made from sustainably sourced fallen trees in the Kashmir Valley. Laptop stands, mobile stands, cable holders, and more — crafted with care, just for you.",
  keywords: [
    "handcrafted wooden desk accessories",
    "Kashmir wood crafts",
    "wooden laptop stand India",
    "sustainable desk accessories",
    "handmade wooden products",
    "Dridha Crafts",
    "wooden mobile stand",
    "desk organizer wood",
  ],
  authors: [{ name: "Dridha Crafts" }],
  creator: "Dridha Crafts",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Dridha Crafts",
    title: "Dridha Crafts — Handmade in the Kashmir Valley",
    description:
      "Handcrafted wooden desk accessories from the forests of Kashmir. Made to last.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dridha Crafts — Handmade in the Kashmir Valley",
    description:
      "Handcrafted wooden desk accessories from the forests of Kashmir.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body antialiased grain-overlay min-h-screen bg-brand-cream text-charcoal flex flex-col justify-between">
        <CustomCursor />
        <LenisProvider>
          <ScrollAnimationProvider>
            <Navbar />
            <CartDrawer />
            <AuthModal />
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
          </ScrollAnimationProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
