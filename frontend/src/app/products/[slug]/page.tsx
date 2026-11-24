import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS_DATA, BUNDLES_DATA, findProductOrBundleBySlug } from "@/lib/products-data";
import { ProductDetailClient } from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const productSlugs = PRODUCTS_DATA.map((p) => ({ slug: p.slug }));
  const bundleSlugs = BUNDLES_DATA.map((b) => ({ slug: b.slug }));
  return [...productSlugs, ...bundleSlugs];
}

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductOrBundleBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Dridha Crafts",
      description: "Handcrafted wooden desk accessories carved from sustainably sourced mountain pine.",
    };
  }

  const primaryImage = product.images?.[0]?.url || "/images/sd-2.jpeg";
  const fullImageUrl = primaryImage.startsWith("http")
    ? primaryImage
    : `https://www.dridhacrafts.co.in${primaryImage}`;

  const title = `${product.name} — Handcrafted Solid Pine | Dridha Crafts`;
  const description =
    product.short_description ||
    `Artisan handcrafted ${product.name} sculpted from fallen pine in Kashmir. Sustainable desk decor, natural finish, free Pan-India delivery.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.dridhacrafts.co.in/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Dridha Crafts`,
      description,
      url: `https://www.dridhacrafts.co.in/products/${product.slug}`,
      siteName: "Dridha Crafts",
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Dridha Crafts`,
      description,
      images: [fullImageUrl],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = findProductOrBundleBySlug(slug);

  if (!product) {
    notFound();
  }

  const allImages = (
    product.images && product.images.length > 0
      ? product.images
      : [{ url: "/images/sd-2.jpeg", alt: product.name }]
  )
    .filter((img) => !img.url.endsWith(".mp4"))
    .map((img) => (img.url.startsWith("http") ? img.url : `https://www.dridhacrafts.co.in${img.url}`));

  const sku = `DC-${product.slug.toUpperCase().replace(/[^A-Z0-9]/g, "-")}`;
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.long_description,
    image: allImages,
    sku,
    mpn: `MPN-${sku}`,
    category: `Home & Garden > Office Supplies > Desk Organizers > ${product.category}`,
    material: "Naturally Fallen Kashmir Mountain Pine Wood",
    brand: {
      "@type": "Brand",
      name: "Dridha Crafts",
    },
    countryOfOrigin: {
      "@type": "Country",
      name: "India",
    },
    offers: {
      "@type": "Offer",
      url: `https://www.dridhacrafts.co.in/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        (product.stock_quantity ?? 10) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Dridha Crafts",
        url: "https://www.dridhacrafts.co.in",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 6,
            unitCode: "d",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
        merchantReturnDays: 0,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "28",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.dridhacrafts.co.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collection",
        item: "https://www.dridhacrafts.co.in/shop",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category,
        item: `https://www.dridhacrafts.co.in/shop?category=${encodeURIComponent(product.category)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `https://www.dridhacrafts.co.in/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  );
}
