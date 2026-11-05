import { api } from "@/lib/api";
import { PRODUCTS_DATA, StaticProduct } from "@/lib/products-data";

export interface ProductVariantItem {
  id: string;
  variant_name: string;
  variant_type: string;
  price_override?: number | null;
  stock_quantity: number;
}

export async function getProducts(): Promise<StaticProduct[]> {
  try {
    const res = await api.get<{ items: any[] }>("/api/products?per_page=50");
    if (res && res.items && res.items.length > 0) {
      return res.items.map((apiP) => {
        const fallback = PRODUCTS_DATA.find((p) => p.slug === apiP.slug || p.id === apiP.id);
        const images =
          apiP.images && apiP.images.length > 0
            ? apiP.images.map((img: any) => ({ url: img.image_url, alt: img.alt_text }))
            : fallback?.images || [{ url: apiP.primary_image_url || "/images/image1.jpeg", alt: apiP.name }];

        return {
          id: apiP.id,
          name: apiP.name,
          slug: apiP.slug,
          short_description: apiP.short_description || fallback?.short_description || "",
          long_description: apiP.long_description || fallback?.long_description || "",
          category: apiP.category,
          price: Number(apiP.price),
          compare_at_price: apiP.compare_at_price ? Number(apiP.compare_at_price) : fallback?.compare_at_price,
          wood_type: apiP.wood_type || fallback?.wood_type || "Kashmir Walnut",
          finish: apiP.finish || fallback?.finish || "Natural Oil",
          weight_kg: Number(apiP.weight_kg) || fallback?.weight_kg || 0.5,
          dimensions: apiP.dimensions || fallback?.dimensions,
          is_featured: Boolean(apiP.is_featured),
          stock_quantity: Number(apiP.stock_quantity ?? fallback?.stock_quantity ?? 10),
          images,
          badge: fallback?.badge || (apiP.is_featured ? "Bestseller" : undefined),
          variants: apiP.variants?.map((v: any) => ({
            id: v.id,
            variant_name: v.variant_name,
            variant_type: v.variant_type,
            price_override: v.price_override ? Number(v.price_override) : null,
            stock_quantity: Number(v.stock_quantity),
          })),
        };
      });
    }
  } catch (err) {
    console.warn("Could not fetch products from backend API, using local product catalog:", err);
  }
  return PRODUCTS_DATA;
}

export async function getProductBySlug(slug: string): Promise<StaticProduct | null> {
  try {
    const apiP = await api.get<any>(`/api/products/${slug}`);
    if (apiP && apiP.id) {
      const fallback = PRODUCTS_DATA.find((p) => p.slug === apiP.slug || p.id === apiP.id);
      const images =
        apiP.images && apiP.images.length > 0
          ? apiP.images.map((img: any) => ({ url: img.image_url, alt: img.alt_text }))
          : fallback?.images || [{ url: apiP.primary_image_url || "/images/image1.jpeg", alt: apiP.name }];

      return {
        id: apiP.id,
        name: apiP.name,
        slug: apiP.slug,
        short_description: apiP.short_description || fallback?.short_description || "",
        long_description: apiP.long_description || fallback?.long_description || "",
        category: apiP.category,
        price: Number(apiP.price),
        compare_at_price: apiP.compare_at_price ? Number(apiP.compare_at_price) : fallback?.compare_at_price,
        wood_type: apiP.wood_type || fallback?.wood_type || "Kashmir Walnut",
        finish: apiP.finish || fallback?.finish || "Natural Oil",
        weight_kg: Number(apiP.weight_kg) || fallback?.weight_kg || 0.5,
        dimensions: apiP.dimensions || fallback?.dimensions,
        is_featured: Boolean(apiP.is_featured),
        stock_quantity: Number(apiP.stock_quantity ?? fallback?.stock_quantity ?? 10),
        images,
        badge: fallback?.badge || (apiP.is_featured ? "Bestseller" : undefined),
        variants: apiP.variants?.map((v: any) => ({
          id: v.id,
          variant_name: v.variant_name,
          variant_type: v.variant_type,
          price_override: v.price_override ? Number(v.price_override) : null,
          stock_quantity: Number(v.stock_quantity),
        })),
      };
    }
  } catch (err) {
    console.warn(`Could not fetch product '${slug}' from API, using local fallback:`, err);
  }
  return PRODUCTS_DATA.find((p) => p.slug === slug) || null;
}

