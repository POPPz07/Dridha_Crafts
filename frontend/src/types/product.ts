export interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  variant_name: string;
  variant_type: string;
  price_override: number | null;
  stock_quantity: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  category: string;
  price: number;
  compare_at_price: number | null;
  wood_type: string;
  finish: string;
  weight_kg: number | null;
  dimensions: string | null;
  care_instructions: string | null;
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number;
  images: ProductImage[];
  variants: ProductVariant[];
  average_rating: number;
  review_count: number;
  created_at: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  category: string;
  price: number;
  compare_at_price: number | null;
  wood_type: string;
  finish: string;
  is_featured: boolean;
  stock_quantity: number;
  primary_image_url: string | null;
}

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number;
  image_url: string | null;
  items: BundleItem[];
  savings: number;
}

export interface BundleItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
