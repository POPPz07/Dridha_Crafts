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
    id: "9180ed68-60bf-44b0-8f7f-bc8d0d691819",
    name: "ShiftDesk Stand (Adjustable)",
    slug: "shiftdesk-stand",
    short_description: "Multi-angle ergonomic wooden riser with carved apertures and front retaining blocks.",
    long_description: "Handcrafted from seasoned Kashmir pine. Precision engineered with multi-angle adjustment slots, allowing seamless adjustment between heavy typing and video conferencing.",
    category: "Laptop and Tablet Stands",
    price: 549,
    compare_at_price: 699,
    wood_type: "Kashmir Pine",
    finish: "Multi-Angle Adjustable Elevation",
    weight_kg: 0.8,
    is_featured: true,
    badge: "Bestseller",
    video_url: "/videos/sd-1.mp4",
    images: [
      { url: "/images/sd-2.jpeg", alt: "ShiftDesk Stand in Kashmir Valley on weathered pine" },
      { url: "/images/sd-3.jpeg", alt: "ShiftDesk Stand 6-angle elevation view" },
      { url: "/images/sd-4.jpeg", alt: "ShiftDesk Stand profile and angle riser view" },
      { url: "/videos/sd-1.mp4", alt: "ShiftDesk Stand Reel Video" },
      { url: "/images/sd-polish-transparent.jpg", alt: "ShiftDesk Stand - Transparent Polish finish" },
      { url: "/images/sd-polish-brown.jpg", alt: "ShiftDesk Stand - Brown Colour Polish finish" },
    ],
    variants: [
      {
        id: "sd-classic-natural",
        variant_name: "Classic Natural Polish",
        variant_type: "Finish",
        price_override: 549,
        stock_quantity: 30,
        image_url: "/images/sd-polish-transparent.jpg",
      },
      {
        id: "sd-rich-brown",
        variant_name: "Rich Brown Polish",
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
        id: "ls-classic-natural",
        variant_name: "Classic Natural Polish",
        variant_type: "Finish",
        price_override: 449,
        stock_quantity: 35,
      },
      {
        id: "ls-rich-brown",
        variant_name: "Rich Brown Polish",
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
        id: "ms-classic-natural",
        variant_name: "Classic Natural Polish",
        variant_type: "Finish",
        price_override: 249,
        stock_quantity: 50,
        image_url: "/images/ms-polish-transparent.jpg",
      },
      {
        id: "ms-rich-brown",
        variant_name: "Rich Brown Polish",
        variant_type: "Finish",
        price_override: 259,
        stock_quantity: 50,
        image_url: "/images/ms-polish-brown.jpg",
      },
    ],
  },
  {
    id: "0be46bc7-8940-4123-8259-ff1e025bc391",
    name: "Dropzone",
    slug: "dropzone",
    short_description: "Dual-purpose headphone perch and smartphone cradle carved from authentic Kashmir pine for an organized desk.",
    long_description: "Handcrafted from sustainably sourced Kashmir Valley pine. The Dropzone combines a curved arch for hanging over-ear headphones with an ergonomic front cradle to hold your smartphone upright for notifications, video calls, or charging. A compact, sculptural desk centerpiece designed with zero-deforestation principles.",
    category: "Headphone Stands",
    price: 349,
    compare_at_price: 399,
    wood_type: "Kashmir Valley Pine",
    finish: "Dual-Purpose Headphone & Phone Dock",
    weight_kg: 0.35,
    dimensions: "14 × 12 × 26 cm",
    is_featured: true,
    badge: "Signature",
    images: [
      { url: "/images/h-1.png", alt: "Dropzone Headphone & Phone Stand angled desk view" },
      { url: "/images/h-2.png", alt: "Dropzone Headphone & Phone Stand front profile view" },
      { url: "/images/h-3.jpeg", alt: "Dropzone Headphone & Phone Stand artisan detail view" },
    ],
    variants: [
      {
        id: "dropzone-classic-natural",
        variant_name: "Classic Natural Polish",
        variant_type: "Finish",
        price_override: 349,
        stock_quantity: 40,
      },
      {
        id: "dropzone-rich-brown",
        variant_name: "Rich Brown Polish",
        variant_type: "Finish",
        price_override: 369,
        stock_quantity: 40,
      },
    ],
  },
  {
    id: "42cdd4b0-3192-4b4f-99e7-978e695bc015",
    name: "Solid Bookends (Pair)",
    slug: "bookends",
    short_description: "Substantial architectural pine blocks weighted to support your books with rustic warmth.",
    long_description: "Handcrafted from salvaged Kashmir pine. These substantial bookends showcase natural grain lines and annual growth rings while holding your library steady.",
    category: "Book Organizers",
    price: 349,
    compare_at_price: 449,
    wood_type: "Kashmir Pine",
    finish: "Handcrafted Natural Pine",
    weight_kg: 0.6,
    is_featured: true,
    badge: "Handcrafted",
    images: [
      { url: "/images/image11.png", alt: "Solid Bookends (Pair)" },
    ],
    variants: [
      {
        id: "bookends-classic-natural",
        variant_name: "Classic Natural Polish",
        variant_type: "Finish",
        price_override: 349,
        stock_quantity: 25,
      },
      {
        id: "bookends-rich-brown",
        variant_name: "Rich Brown Polish",
        variant_type: "Finish",
        price_override: 369,
        stock_quantity: 25,
      },
    ],
  },
];

export interface StaticBundle {
  id: string;
  name: string;
  slug: string;
  type?: "duo" | "trio";
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
  // ── 4 WORKSTATION DUOS (10% OFF sum of individual discounted prices) ─────────
  {
    id: "da923af9-bc88-4b02-ab20-2ef88ba74fd4",
    name: "ShiftDesk + Dropzone Stand",
    slug: "shiftdesk-headphone-stand",
    type: "duo",
    price: 808,
    original_price: 898,
    savings: 90,
    discount_percentage: 10,
    description: "Multi-angle ergonomic wooden ShiftDesk riser paired with our Dropzone dual headphone & phone stand for an organized, premium workstation.",
    items: ["ShiftDesk Stand (Adjustable)", "Dropzone"],
    image: "/images/bundles/bundle-shiftdesk-headphone.jpg",
    item_images: ["/images/sd-2.jpeg", "/images/h-1.png"],
    badge: "10% OFF Duo",
  },
  {
    id: "4506690d-fb08-4f9e-9db9-7c820befea09",
    name: "Laptop Stand + Dropzone Stand",
    slug: "laptop-headphone-stand",
    type: "duo",
    price: 718,
    original_price: 798,
    savings: 80,
    discount_percentage: 10,
    description: "Slotted Himalayan pine Laptop Stand paired with our Dropzone dual headphone & phone stand. Maximum airflow elevation with dedicated audio gear display.",
    items: ["Handcrafted Multi-Angle Laptop Stand", "Dropzone"],
    image: "/images/bundles/bundle-laptop-headphone.jpg",
    item_images: ["/images/ls-6.png", "/images/h-2.png"],
    badge: "10% OFF Duo",
  },
  {
    id: "9161dabd-4082-43b7-a400-bd28adfb6c6e",
    name: "ShiftDesk + Mobile Stand",
    slug: "shiftdesk-mobile-stand",
    type: "duo",
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
    id: "9e41736e-1d44-4118-bb88-7cee7987e6b7",
    name: "Laptop Stand + Mobile Stand",
    slug: "laptop-mobile-stand",
    type: "duo",
    price: 628,
    original_price: 698,
    savings: 70,
    discount_percentage: 10,
    description: "Ergonomic ventilation-cutout Laptop Stand paired with the interlocking Mobile Stand. Our signature Himalayan pine duo for compact productivity.",
    items: ["Handcrafted Multi-Angle Laptop Stand", "Interlocking Wooden Mobile Stand"],
    image: "/images/bundles/bundle-laptop-mobile.jpg",
    item_images: ["/images/ls-6.png", "/images/ms-1.jpg"],
    badge: "10% OFF Duo",
  },

  // ── 3 ARTISAN TRIOS (15% OFF sum of individual discounted prices) ─────────
  {
    id: "b1a10001-c888-4f01-b333-7cee7987e001",
    name: "ShiftDesk + Laptop Stand + Mobile Stand",
    slug: "shiftdesk-laptop-mobile-trio",
    type: "trio",
    price: 1060,
    original_price: 1247,
    savings: 187,
    discount_percentage: 15,
    description: "The complete multi-screen workstation: dynamic ShiftDesk riser, ventilated Multi-Angle Laptop Stand, and interlocking Mobile Stand for maximum ergonomic comfort.",
    items: [
      "ShiftDesk Stand (Adjustable)",
      "Handcrafted Multi-Angle Laptop Stand",
      "Interlocking Wooden Mobile Stand",
    ],
    image: "/images/bundles/bundle-shiftdesk-laptop-mobile.jpg",
    item_images: ["/images/sd-2.jpeg", "/images/ls-6.png", "/images/ms-1.jpg"],
    badge: "15% OFF Trio",
  },
  {
    id: "b1a10002-c888-4f01-b333-7cee7987e002",
    name: "ShiftDesk + Dropzone + Mobile Stand",
    slug: "shiftdesk-dropzone-mobile-trio",
    type: "trio",
    price: 975,
    original_price: 1147,
    savings: 172,
    discount_percentage: 15,
    description: "The ultimate creator setup: adjustable ShiftDesk laptop riser, Dropzone dual headphone & phone cradle, and interlocking Mobile Stand for total desk organization.",
    items: [
      "ShiftDesk Stand (Adjustable)",
      "Dropzone",
      "Interlocking Wooden Mobile Stand",
    ],
    image: "/images/bundles/bundle-shiftdesk-dropzone-mobile.jpg",
    item_images: ["/images/sd-2.jpeg", "/images/h-1.png", "/images/ms-1.jpg"],
    badge: "15% OFF Trio",
  },
  {
    id: "b1a10003-c888-4f01-b333-7cee7987e003",
    name: "Laptop Stand + Dropzone + Mobile Stand",
    slug: "laptop-dropzone-mobile-trio",
    type: "trio",
    price: 890,
    original_price: 1047,
    savings: 157,
    discount_percentage: 15,
    description: "Lightweight, slotted Himalayan Pine Laptop Stand combined with our Dropzone headphone dock and interlocking Mobile Stand for streamlined efficiency.",
    items: [
      "Handcrafted Multi-Angle Laptop Stand",
      "Dropzone",
      "Interlocking Wooden Mobile Stand",
    ],
    image: "/images/bundles/bundle-laptop-dropzone-mobile.jpg",
    item_images: ["/images/ls-6.png", "/images/h-1.png", "/images/ms-1.jpg"],
    badge: "15% OFF Trio",
  },
];

export function findProductOrBundleBySlug(slug: string): StaticProduct | null {
  const directProduct = PRODUCTS_DATA.find((p) => p.slug === slug);
  if (directProduct) return directProduct;

  const bundle = BUNDLES_DATA.find((b) => b.slug === slug);
  if (bundle) {
    const isTrio = bundle.type === "trio" || bundle.items.length === 3;
    return {
      id: bundle.id,
      name: bundle.name,
      slug: bundle.slug,
      short_description: bundle.description,
      long_description: `${bundle.description} Curated ${isTrio ? "trio combination of three" : "duo combination of two"} handcrafted Kashmir pine desk essentials: ${bundle.items.join(", ")}. Includes an exclusive ${bundle.discount_percentage || (isTrio ? 15 : 10)}% bundle discount.`,
      category: "Office Desk Collection",
      price: bundle.price,
      compare_at_price: bundle.original_price,
      wood_type: isTrio ? "Kashmir Pine Trio" : "Kashmir Pine Duo",
      finish: "Handcrafted Natural Pair",
      weight_kg: isTrio ? 1.25 : 0.85,
      dimensions: isTrio ? "Full Desk Trio Set" : "Desk Duo Set",
      is_featured: true,
      badge: "Bestseller",
      stock_quantity: 20,
      images: [
        { url: bundle.image, alt: `${bundle.name} - ${isTrio ? "Trio" : "Duo"} Collection` },
        ...(bundle.item_images
          ? bundle.item_images.map((img, i) => ({
              url: img,
              alt: `${bundle.items[i] || bundle.name} component`,
            }))
          : []),
      ],
      variants: [],
    };
  }
  return null;
}
