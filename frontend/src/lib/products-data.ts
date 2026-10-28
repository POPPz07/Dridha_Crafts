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
  images: {
    url: string;
    alt: string;
  }[];
  badge?: "Handcrafted" | "Bestseller" | "Signature" | "Popular";
}

export const PRODUCTS_DATA: StaticProduct[] = [
  {
    id: "prod-1",
    name: "ShiftDesk Stand (Adjustable)",
    slug: "shiftdesk-stand",
    short_description: "6-level ergonomic elevation crafted from solid Kashmir walnut. Folds completely flat.",
    long_description: "The ShiftDesk Stand is our premier multi-angle ergonomic riser. Precision cut with 6 distinct tilt angles ranging from 18° to 58°, allowing seamless adjustment between heavy typing and video conferencing.",
    category: "Laptop Stands",
    price: 649,
    compare_at_price: 799,
    wood_type: "Kashmir Walnut",
    finish: "Hand-rubbed natural oil",
    weight_kg: 0.8,
    is_featured: true,
    badge: "Bestseller",
    images: [
      { url: "/images/image1.jpeg", alt: "6 levels adjustable wooden laptop stand" },
      { url: "/images/image2.jpeg", alt: "ShiftDesk laptop stand in use" },
    ],
  },
  {
    id: "prod-2",
    name: "Signature Fixed Laptop Stand",
    slug: "signature-fixed-laptop-stand",
    short_description: "Minimalist continuous wooden arc designed for optimal airflow and neck posture.",
    long_description: "Streamlined elegance meets practical desk ergonomics. Hand-beveled curves allow maximum underside airflow while elevating your screen to natural eye level.",
    category: "Laptop Stands",
    price: 599,
    compare_at_price: 699,
    wood_type: "Kashmir Walnut",
    finish: "Signature Satin Finish",
    weight_kg: 0.8,
    is_featured: true,
    badge: "Signature",
    images: [
      { url: "/images/image2.jpeg", alt: "Fixed wooden laptop stand with laptop" },
      { url: "/images/image1.jpeg", alt: "Fixed wooden stand angle" },
    ],
  },
  {
    id: "prod-3",
    name: "Sculptural Headphone Stand",
    slug: "headphone-stand",
    short_description: "An architectural focal point for your desk that gracefully cradles your audio gear.",
    long_description: "Carved out of single-block timber salvaged from Kashmir valleys. The curved crown preserves headphone headband tension while the sweeping base delivers steady balance.",
    category: "Audio Accessories",
    price: 549,
    compare_at_price: 699,
    wood_type: "Kashmir Walnut",
    finish: "Natural Beeswax",
    weight_kg: 0.5,
    is_featured: true,
    badge: "Handcrafted",
    images: [
      { url: "/images/image9.jpeg", alt: "Sculptural wooden headphone stand on desk" },
      { url: "/images/image8.jpeg", alt: "Handmade wooden headphone stand" },
      { url: "/images/image10.jpeg", alt: "Headphone stand with accessory tray" },
    ],
  },
  {
    id: "prod-4",
    name: "Magnetic Wooden Cable Holder",
    slug: "cable-holder",
    short_description: "Dual-tone walnut organizer with 3 neodymium magnetic pods for tangle-free cables.",
    long_description: "Keep your charging cords anchored and accessible. Features a solid timber dock with embedded magnets and three precision-slotted magnetic collar blocks.",
    category: "Desk Organizers",
    price: 299,
    compare_at_price: 399,
    wood_type: "Kashmir Walnut & Ash",
    finish: "Smooth Matte",
    weight_kg: 0.15,
    is_featured: true,
    badge: "Popular",
    images: [
      { url: "/images/image14.jpeg", alt: "Magnetic wooden cable holder with cables" },
      { url: "/images/image15.jpeg", alt: "Magnetic wooden cable holder components" },
    ],
  },
  {
    id: "prod-5",
    name: "Minimalist Mobile Stand",
    slug: "mobile-stand",
    short_description: "Natural timber phone cradle with dual-orientation viewing slot for calls and media.",
    long_description: "A compact essential milled to hold smartphones with or without cases. Ideal for FaceTime, desk clocks, and video viewing.",
    category: "Phone Stands",
    price: 349,
    compare_at_price: 449,
    wood_type: "Kashmir Walnut",
    finish: "Silky Wax",
    weight_kg: 0.2,
    is_featured: true,
    images: [
      { url: "/images/image7.jpeg", alt: "Minimalist wooden mobile stand" },
      { url: "/images/image6.jpeg", alt: "Wooden phone stand on desk" },
      { url: "/images/image5.jpeg", alt: "Mobile stand presentation" },
    ],
  },
  {
    id: "prod-6",
    name: "Multi-Angle Tablet Stand",
    slug: "tablet-stand",
    short_description: "Foldable 3-level tablet and sketch easel for iPads, e-readers, and tablets.",
    long_description: "Engineered with triple-step locking angles for stylus drawing, typing, and video streaming. Folds pancake-flat into your sleeve.",
    category: "Tablet Stands",
    price: 449,
    compare_at_price: 549,
    wood_type: "Kashmir Walnut",
    finish: "Protective Clear Matte",
    weight_kg: 0.4,
    is_featured: false,
    images: [
      { url: "/images/image3.jpeg", alt: "Adjustable wooden tablet stand" },
      { url: "/images/image4.jpeg", alt: "Folded tablet stand" },
    ],
  },
  {
    id: "prod-7",
    name: "Solid Walnut Bookends (Pair)",
    slug: "bookends",
    short_description: "Heavyweight architectural blocks highlighting natural grain and live tree contours.",
    long_description: "Substantial hardwood bookends weighted to support your library with timeless rustic warmth. Each pair reveals distinctive concentric rings and grain flows.",
    category: "Desk Decor",
    price: 599,
    compare_at_price: 799,
    wood_type: "Kashmir Walnut",
    finish: "Deep Organic Oil",
    weight_kg: 0.6,
    is_featured: false,
    badge: "Handcrafted",
    images: [
      { url: "/images/image11.png", alt: "Solid wooden bookends with books" },
      { url: "/images/image12.jpeg", alt: "Artistic fan wooden bookends" },
      { url: "/images/image13.jpeg", alt: "Reader wooden bookends" },
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
  description: string;
  items: string[];
  image: string;
  badge: string;
}

export const BUNDLES_DATA: StaticBundle[] = [
  {
    id: "bundle-1",
    name: "Work From Home Set",
    slug: "work-from-home-set",
    price: 999,
    original_price: 1187,
    savings: 188,
    description: "Our essential desk trio: Fixed Laptop Stand + Mobile Stand + Magnetic Cable Holder. Everything you need to transform your daily work ergonomics.",
    items: ["Fixed Laptop Stand", "Mobile Stand", "Magnetic Cable Holder"],
    image: "/images/image2.jpeg",
    badge: "Most Popular Bundle",
  },
  {
    id: "bundle-2",
    name: "ShiftDesk Pro Set",
    slug: "shiftdesk-pro-set",
    price: 1099,
    original_price: 1297,
    savings: 198,
    description: "The multi-angle setup: 6-Level ShiftDesk Stand + Mobile Stand + Magnetic Cable Holder for maximum work posture flexibility.",
    items: ["ShiftDesk Stand (6 Angles)", "Mobile Stand", "Magnetic Cable Holder"],
    image: "/images/image1.jpeg",
    badge: "Best Ergonomics",
  },
  {
    id: "bundle-3",
    name: "Signature ShiftDesk Set",
    slug: "signature-shiftdesk-set",
    price: 1199,
    original_price: 1397,
    savings: 198,
    description: "Hand-finished Signature ShiftDesk Stand + Mobile Stand + Magnetic Cable Holder in our deepest Kashmir walnut grain.",
    items: ["Signature ShiftDesk Stand", "Mobile Stand", "Magnetic Cable Holder"],
    image: "/images/image9.jpeg",
    badge: "Luxury Finish",
  },
];
