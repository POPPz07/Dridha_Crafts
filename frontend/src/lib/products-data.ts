export interface StaticProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string;
  category: string;
  price: number;
  compare_at_price?: number;
  wood_type: string;
  finish: string;
  weight_kg: number;
  dimensions?: string;
  is_featured: boolean;
  stock_quantity?: number;
  images: {
    url: string;
    alt: string;
  }[];
  video_url?: string;
  variants?: {
    id: string;
    variant_name: string;
    variant_type: string;
    price_override?: number | null;
    stock_quantity: number;
    image_url?: string;
  }[];
  badge?: "Handcrafted" | "Bestseller" | "Signature" | "Popular";
}

export const PRODUCTS_DATA: StaticProduct[] = [
  {
    id: "42cdd4b0-3192-4b4f-99e7-978e695bc015",
    name: "Solid Walnut Bookends (Pair)",
    slug: "bookends",
    short_description: "Substantial architectural timber blocks weighted to support your books with rustic warmth.",
    long_description: "Handcrafted from salvaged Kashmir timber. These substantial bookends showcase natural grain lines and annual growth rings while holding your library steady.",
    category: "Book Organizers",
    price: 349,
    compare_at_price: 449,
    wood_type: "Kashmir Walnut",
    finish: "Handcrafted Natural Timber",
    weight_kg: 0.6,
    is_featured: true,
    badge: "Handcrafted",
    images: [
      { url: "/images/image11.png", alt: "Solid Walnut Bookends (Pair)" },
    ],
    variants: [
      {
        id: "bookends-unpolished",
        variant_name: "Unpolished (Natural Raw Wood)",
        variant_type: "Finish",
        price_override: 349,
        stock_quantity: 25,
      },
      {
        id: "bookends-polished-trans",
        variant_name: "Polished — Transparent Polish (+₹20)",
        variant_type: "Finish",
        price_override: 369,
        stock_quantity: 25,
      },
      {
        id: "bookends-polished-brown",
        variant_name: "Polished — Brown Colour Polish (+₹20)",
        variant_type: "Finish",
        price_override: 369,
        stock_quantity: 25,
      },
    ],
  },
  {
    id: "9180ed68-60bf-44b0-8f7f-bc8d0d691819",
    name: "ShiftDesk Stand (Adjustable)",
    slug: "shiftdesk-stand",
    short_description: "Multi-angle ergonomic wooden riser with carved apertures and front retaining blocks.",
    long_description: "Handcrafted from seasoned Kashmir timber. Precision engineered with multi-angle adjustment slots, allowing seamless adjustment between heavy typing and video conferencing.",
    category: "Laptop and Tablet Stands",
    price: 549,
    compare_at_price: 699,
    wood_type: "Kashmir Pine & Walnut",
    finish: "Multi-Angle Adjustable Elevation",
    weight_kg: 0.8,
    is_featured: true,
    badge: "Bestseller",
    video_url: "/videos/sd-1.mp4",
    images: [
      { url: "/images/sd-2.jpeg", alt: "ShiftDesk Stand in Kashmir Valley on weathered timber" },
      { url: "/images/sd-3.jpeg", alt: "ShiftDesk Stand 6-angle elevation view" },
      { url: "/images/sd-4.jpeg", alt: "ShiftDesk Stand profile and angle riser view" },
      { url: "/videos/sd-1.mp4", alt: "ShiftDesk Stand Reel Video" },
      { url: "/images/sd-polish-transparent.jpg", alt: "ShiftDesk Stand - Transparent Polish finish" },
      { url: "/images/sd-polish-brown.jpg", alt: "ShiftDesk Stand - Brown Colour Polish finish" },
    ],
    variants: [
      {
        id: "sd-unpolished",
        variant_name: "Unpolished (Natural Raw Wood)",
        variant_type: "Finish",
        price_override: 549,
        stock_quantity: 30,
      },
      {
        id: "sd-polished-trans",
        variant_name: "Polished — Transparent Polish (+₹20)",
        variant_type: "Finish",
        price_override: 569,
        stock_quantity: 30,
        image_url: "/images/sd-polish-transparent.jpg",
      },
      {
        id: "sd-polished-brown",
        variant_name: "Polished — Brown Colour Polish (+₹20)",
        variant_type: "Finish",
        price_override: 569,
        stock_quantity: 30,
        image_url: "/images/sd-polish-brown.jpg",
      },
    ],
  },
  {
    id: "5f235bcd-1d7c-4003-b181-3b98b0d93240",
    name: "Handcrafted Multi-Angle Laptop Stand",
    slug: "laptop-stand",
    short_description: "Solid wooden laptop riser featuring central ventilation cutout and multi-level adjustment pegs.",
    long_description: "Artisan-carved from Kashmir Valley pine. Features a diamond airflow center, rounded adjustment holes, and dual locking pins for ergonomic elevation.",
    category: "Laptop and Tablet Stands",
    price: 449,
    compare_at_price: 579,
    wood_type: "Kashmir Valley Pine",
    finish: "Slotted Multi-Level Elevation",
    weight_kg: 0.7,
    is_featured: true,
    badge: "Signature",
    video_url: "/videos/ls-5.mp4",
    images: [
      { url: "/images/ls-6.png", alt: "Handcrafted Multi-Angle Laptop Stand on desk with laptop" },
      { url: "/images/ls-1.jpg", alt: "Handcrafted Laptop Stand top perspective on grass" },
      { url: "/images/ls-2.jpg", alt: "Handcrafted Laptop Stand angle view in sunlight" },
      { url: "/images/ls-3.jpg", alt: "Handcrafted Laptop Stand perspective with adjustment dowels" },
      { url: "/images/ls-4.jpg", alt: "Handcrafted Laptop Stand studio cutout" },
      { url: "/videos/ls-5.mp4", alt: "Handcrafted Laptop Stand Assembly Video" },
    ],
    variants: [
      {
        id: "ls-unpolished",
        variant_name: "Unpolished (Natural Raw Wood)",
        variant_type: "Finish",
        price_override: 449,
        stock_quantity: 35,
      },
      {
        id: "ls-polished-trans",
        variant_name: "Polished — Transparent Polish (+₹20)",
        variant_type: "Finish",
        price_override: 469,
        stock_quantity: 35,
      },
      {
        id: "ls-polished-brown",
        variant_name: "Polished — Brown Colour Polish (+₹20)",
        variant_type: "Finish",
        price_override: 469,
        stock_quantity: 35,
      },
    ],
  },
  {
    id: "31e508df-81ec-41cb-9446-79855ce4e9bd",
    name: "Interlocking Wooden Mobile Stand",
    slug: "mobile-stand",
    short_description: "Two-piece interlocking phone cradle with charging cable notch and ergonomic tilt.",
    long_description: "Carved from Kashmir Valley pine. The upright backrest and slotted perch lock together effortlessly for desk use, video calls, and charging.",
    category: "Mobile Stands",
    price: 249,
    compare_at_price: 349,
    wood_type: "Kashmir Valley Pine",
    finish: "Two-Piece Interlocking Joinery",
    weight_kg: 0.2,
    is_featured: true,
    badge: "Popular",
    video_url: "/videos/ms-5.mp4",
    images: [
      { url: "/images/ms-1.jpg", alt: "Interlocking Wooden Mobile Stand on lawn" },
      { url: "/images/ms-2.jpg", alt: "Wooden Mobile Stand supporting smartphone on desk" },
      { url: "/images/ms-3.jpg", alt: "Dual Mobile Stands with transparent and brown finishes" },
      { url: "/images/ms-4.jpg", alt: "Two-piece interlocking mobile stand profile" },
      { url: "/videos/ms-5.mp4", alt: "Interlocking Wooden Mobile Stand Video 1" },
      { url: "/videos/ms-6.mp4", alt: "Interlocking Wooden Mobile Stand Video 2" },
      { url: "/images/ms-polish-transparent.jpg", alt: "Mobile Stand - Transparent Polish finish" },
      { url: "/images/ms-polish-brown.jpg", alt: "Mobile Stand - Brown Colour Polish finish" },
    ],
    variants: [
      {
        id: "ms-unpolished",
        variant_name: "Unpolished (Natural Raw Wood)",
        variant_type: "Finish",
        price_override: 249,
        stock_quantity: 50,
      },
      {
        id: "ms-polished-trans",
        variant_name: "Polished — Transparent Polish (+₹10)",
        variant_type: "Finish",
        price_override: 259,
        stock_quantity: 50,
        image_url: "/images/ms-polish-transparent.jpg",
      },
      {
        id: "ms-polished-brown",
        variant_name: "Polished — Brown Colour Polish (+₹10)",
        variant_type: "Finish",
        price_override: 259,
        stock_quantity: 50,
        image_url: "/images/ms-polish-brown.jpg",
      },
    ],
  },
];

export interface StaticBundle {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  savings: number;
  discount_percentage?: number;
  description: string;
  items: string[];
  image: string;
  item_images?: string[];
  badge: string;
}

export const BUNDLES_DATA: StaticBundle[] = [
  {
    id: "bundle-shiftdesk-headphone",
    name: "ShiftDesk + Headphone Stand",
    slug: "shiftdesk-headphone-stand",
    price: 988,
    original_price: 1098,
    savings: 110,
    discount_percentage: 10,
    description: "Multi-angle ergonomic wooden ShiftDesk riser paired with our handcrafted solid timber Headphone Stand for an organized, premium workstation.",
    items: ["ShiftDesk Stand (Adjustable)", "Solid Timber Headphone Stand"],
    image: "/images/bundles/bundle-shiftdesk-headphone.jpg",
    item_images: ["/images/sd-2.jpeg", "/images/h-1.png"],
    badge: "10% OFF Duo",
  },
  {
    id: "bundle-laptop-headphone",
    name: "Laptop Stand + Headphone Stand",
    slug: "laptop-headphone-stand",
    price: 898,
    original_price: 998,
    savings: 100,
    discount_percentage: 10,
    description: "Slotted Himalayan pine Laptop Stand paired with our solid timber Headphone Stand. Maximum airflow elevation with dedicated audio gear display.",
    items: ["Handcrafted Multi-Angle Laptop Stand", "Solid Timber Headphone Stand"],
    image: "/images/bundles/bundle-laptop-headphone.jpg",
    item_images: ["/images/ls-6.png", "/images/h-2.png"],
    badge: "10% OFF Duo",
  },
  {
    id: "bundle-shiftdesk-mobile",
    name: "ShiftDesk + Mobile Stand",
    slug: "shiftdesk-mobile-stand",
    price: 718,
    original_price: 798,
    savings: 80,
    discount_percentage: 10,
    description: "Dynamic 6-angle ShiftDesk riser paired with the interlocking Mobile Stand for seamless dual-screen workflow and hands-free video calls.",
    items: ["ShiftDesk Stand (Adjustable)", "Interlocking Wooden Mobile Stand"],
    image: "/images/bundles/bundle-shiftdesk-mobile.jpg",
    item_images: ["/images/sd-2.jpeg", "/images/ms-1.jpg"],
    badge: "10% OFF Duo",
  },
  {
    id: "bundle-laptop-mobile",
    name: "Laptop Stand + Mobile Stand",
    slug: "laptop-mobile-stand",
    price: 628,
    original_price: 698,
    savings: 70,
    discount_percentage: 10,
    description: "Ergonomic ventilation-cutout Laptop Stand paired with the interlocking Mobile Stand. Our signature Himalayan timber duo for compact productivity.",
    items: ["Handcrafted Multi-Angle Laptop Stand", "Interlocking Wooden Mobile Stand"],
    image: "/images/bundles/bundle-laptop-mobile.jpg",
    item_images: ["/images/ls-6.png", "/images/ms-1.jpg"],
    badge: "10% OFF Duo",
  },
];
