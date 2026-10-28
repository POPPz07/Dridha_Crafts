export interface OrderItem {
  id: string;
  product_name: string;
  product_slug: string;
  variant_name: string | null;
  price: number;
  quantity: number;
  total: number;
  image_url: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus;
  shipping_name: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  notes: string | null;
  tracking_number: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "payment_verification"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "cod_pending"
  | "manual_verification"
  | "confirmed"
  | "failed"
  | "refunded";

export interface OrderListItem {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus;
  item_count: number;
  created_at: string;
}
