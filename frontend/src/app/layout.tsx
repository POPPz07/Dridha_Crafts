import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ScrollAnimationProvider } from "@/components/providers/ScrollAnimationProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { TopProgressBar } from "@/components/common/TopProgressBar";
import { MediaProtection } from "@/components/common/MediaProtection";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dridhacrafts.co.in"),
  title: {
    default: "Dridha Crafts — Handcrafted Solid Pine Desk Accessories | Kashmir Valley",
    template: "%s | Dridha Crafts",
  },
  description:
    "Handcrafted wooden desk accessories made from sustainably sourced fallen pine trees in the Kashmir Valley. Laptop stands, mobile holders, headphone stands, and desk organizers — crafted with care, just for you.",
  keywords: [
    "handcrafted wooden desk accessories",
    "Kashmir wood crafts",
    "sustainable wooden decor",
    "artisanal desk organiser",
    "wooden laptop stand India",
    "Dridha Crafts",
    "pine wood organizers",
    "artisan desk sets",
    "wooden mobile holder",
    "handcrafted desk setups",
  ],
  authors: [{ name: "Dridha Crafts" }],
  creator: "Dridha Crafts",
  alternates: {
    canonical: "https://www.dridhacrafts.co.in",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.dridhacrafts.co.in",
    siteName: "Dridha Crafts",
    title: "Dridha Crafts — Handcrafted Solid Pine Desk Accessories",
    description:
      "Handcrafted wooden desk accessories made from sustainably sourced fallen trees. Laptop stands, mobile stands, cable holders, and more.",
    images: [
      {
        url: "/images/image1.jpeg",
        width: 1200,
        height: 630,
        alt: "Dridha Crafts Handcrafted Pine Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dridha Crafts — Handcrafted Solid Pine Desk Accessories",
    description:
      "Handcrafted wooden desk accessories made from sustainably sourced fallen pine trees in the Kashmir Valley.",
    images: ["/images/image1.jpeg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
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

const brandKnowledgeGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.dridhacrafts.co.in/#organization",
      name: "Dridha Crafts",
      url: "https://www.dridhacrafts.co.in",
      logo: {
        "@type": "ImageObject",
        url: "https://www.dridhacrafts.co.in/images/image1.jpeg",
        caption: "Dridha Crafts Handcrafted Atelier",
      },
      description:
        "Handcrafted solid pine desk accessories and organizers made from sustainably sourced fallen trees in the Kashmir Valley.",
      email: "craftsdridha@gmail.com",
      telephone: "+919767807889",
      sameAs: [
        "https://www.instagram.com/dridha_crafts",
        "https://www.youtube.com/@DridhaCrafts",
      ],
      address: {
        "@type": "PostalAddress",
        addressRegion: "Jammu and Kashmir",
        addressCountry: "IN",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+919767807889",
          contactType: "customer service",
          email: "craftsdridha@gmail.com",
          availableLanguage: ["English", "Hindi"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.dridhacrafts.co.in/#website",
      url: "https://www.dridhacrafts.co.in",
      name: "Dridha Crafts",
      description:
        "Handcrafted Solid Pine Desk Accessories & Organizers from Kashmir",
      publisher: {
        "@id": "https://www.dridhacrafts.co.in/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.dridhacrafts.co.in/shop?category={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandKnowledgeGraph) }}
        />
      </head>
      <body className="font-body antialiased grain-overlay min-h-screen bg-brand-cream text-charcoal flex flex-col justify-between">
        <MediaProtection />
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <CustomCursor />
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  );
}
