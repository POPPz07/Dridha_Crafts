export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: "customer" | "admin";
  created_at: string;
}

export interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: {
    name: string;
    slug: string;
    price: number;
    primary_image_url: string | null;
    stock_quantity: number;
  };
  variant: {
    variant_name: string;
    price_override: number | null;
  } | null;
}
