import { MetadataRoute } from "next";
import { PRODUCTS_DATA, BUNDLES_DATA } from "@/lib/products-data";

const SITE_URL = "https://www.dridhacrafts.co.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  // Core static marketing and storefront routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/story`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic product routes
  const productRoutes: MetadataRoute.Sitemap = PRODUCTS_DATA.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  // Dynamic bundle combo routes
  const bundleRoutes: MetadataRoute.Sitemap = BUNDLES_DATA.map((bundle) => ({
    url: `${SITE_URL}/products/${bundle.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes, ...bundleRoutes];
}
