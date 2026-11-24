import type { Metadata } from "next";
import { PRODUCTS_DATA, BUNDLES_DATA } from "@/lib/products-data";
import { ShopClient } from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop Handcrafted Wooden Desk Accessories & Organizers | Dridha Crafts",
  description:
    "Explore our complete collection of handcrafted mountain pine desk accessories, laptop stands, mobile holders, headphone stands, and curated duo & trio gift combos. Pan-India delivery.",
  alternates: {
    canonical: "https://www.dridhacrafts.co.in/shop",
  },
  openGraph: {
    title: "Shop Handcrafted Solid Pine Desk Accessories | Dridha Crafts",
    description:
      "Explore our full collection of handcrafted mountain pine desk accessories, laptop risers, mobile docks, and artisan gift combos.",
    url: "https://www.dridhacrafts.co.in/shop",
    siteName: "Dridha Crafts",
    type: "website",
    images: [
      {
        url: "https://www.dridhacrafts.co.in/images/sd-2.jpeg",
        width: 1200,
        height: 630,
        alt: "Dridha Crafts Handcrafted Pine Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Handcrafted Wooden Desk Accessories | Dridha Crafts",
    description:
      "Explore our full collection of handcrafted pine desk accessories, laptop risers, and artisan combos.",
    images: ["https://www.dridhacrafts.co.in/images/sd-2.jpeg"],
  },
};

export default function ShopPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Dridha Crafts Wooden Desk Accessories & Organizers",
    description:
      "Complete collection of artisan handcrafted pine desk accessories, phone stands, laptop risers, and desk organizers.",
    url: "https://www.dridhacrafts.co.in/shop",
    mainEntity: {
      "@type": "ItemList",
      name: "Handcrafted Solid Pine Desk Collection",
      numberOfItems: PRODUCTS_DATA.length + BUNDLES_DATA.length,
      itemListElement: [
        ...PRODUCTS_DATA.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: `https://www.dridhacrafts.co.in/products/${product.slug}`,
          image: product.images[0]?.url.startsWith("http")
            ? product.images[0]?.url
            : `https://www.dridhacrafts.co.in${product.images[0]?.url}`,
        })),
        ...BUNDLES_DATA.map((bundle, index) => ({
          "@type": "ListItem",
          position: PRODUCTS_DATA.length + index + 1,
          name: bundle.name,
          url: `https://www.dridhacrafts.co.in/products/${bundle.slug}`,
          image: bundle.image.startsWith("http")
            ? bundle.image
            : `https://www.dridhacrafts.co.in${bundle.image}`,
        })),
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <ShopClient />
    </>
  );
}
