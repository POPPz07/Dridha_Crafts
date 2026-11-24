# 🌲 Dridha Crafts — Frontend Architecture & Storefront

**Modern Next.js 16 WebGL-accelerated e-commerce storefront for handcrafted Kashmiri wooden desk accessories.**

[![Live Storefront](https://img.shields.io/badge/Live_Storefront-dridhacrafts.vercel.app-123526?style=flat-square&logo=vercel)](https://dridhacrafts.vercel.app/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat-square&logo=three.js)](https://threejs.org/)

---

## 🚀 Overview

The **Dridha Crafts Frontend** is built using Next.js 16 (App Router) and React 19. It combines ultra-fast server-side rendering (SSR) and incremental static regeneration (ISR) with immersive WebGL 3D model previews, bespoke micro-interactions, smooth inertial scrolling, and a dual-checkout payment pipeline.

* **Production URL**: [https://dridhacrafts.vercel.app/](https://dridhacrafts.vercel.app/)
* **Platform**: Vercel Edge Network
* **Build Engine**: Webpack production build with Turbopack local development

---

## 🎨 Design System & Visual Identity

The interface reflects the craftsmanship of the Kashmir Valley, balancing earthy, natural wood aesthetics with high-precision modern minimalism:

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Pine Forest Green** | `#0e2a1e` / `#123526` | Signature brand background, persistent navigation bars, primary CTAs |
| **Himalayan Gold** | `#C5A880` / `#e5c89d` | Accent trims, active stage highlights, rating stars, hover accents |
| **Craft Cream** | `#FAF8F5` | Primary warm background for product discovery and storytelling |
| **Charcoal Pine** | `#2C2C2C` / `#1A1A1A` | High-contrast typography, technical specifications, and body copy |

---

## 📐 Architecture & Key Subsystems

### 1. Interactive 3D Product Canvas (`src/components/3d/`)
* Powered by **`@react-three/fiber`** and **`@react-three/drei`**.
* Interactive 360° orbital preview for key hero items (e.g., *Dropzone Tray*, *Bespoke Desk Caddy*).
* Procedural pine textures, studio softboxes, ambient occlusion, dynamic camera framing, and canvas auto-resizing.
* Built with dynamic imports (`next/dynamic` with `ssr: false`) and lightweight skeleton placeholders to ensure zero penalty on Largest Contentful Paint (LCP).

### 2. Dual Checkout Pipeline (`src/app/checkout/`)
* **Cashfree PG Engine**:
  - Dynamically mounts the Cashfree JS SDK (`@cashfreepayments/cashfree-js`).
  - Fetches secure payment session IDs from `/api/payments/create-session`.
  - Opens seamless hosted checkout with auto-redirection on success.
* **Direct WhatsApp UPI Flow**:
  - Generates tamper-proof order payloads encoded with order IDs, SKU breakdowns, and direct UPI QR prompts.
  - Automatically formats structured order text and redirects to WhatsApp Web/App.

### 3. State Management (`src/stores/`)
* **`cartStore.ts`**: Zustand store with automatic `localStorage` persistence, optimistic quantity updates, and cart drawer toggling.
* **`authStore.ts`**: Handles Supabase session synchronization, user profiles, and role elevation checks.

### 4. Edge Route Protection (`src/proxy.ts` / Middleware)
* Intercepts `/admin/:path*` requests before the HTML shell is rendered.
* Evaluates authenticated Supabase claims (`app_metadata.role === "admin"`).
* Unauthenticated or non-admin visitors are instantly redirected to the storefront homepage (`/`).

---

## 📁 Source Directory Structure

```
frontend/
├── public/                 # Static assets, 3D GLTF models, branding SVG
├── src/
│   ├── app/
│   │   ├── admin/          # Super Admin Dashboard (5 Operational Tabs)
│   │   ├── checkout/       # Multi-step checkout (Address -> Payment Choice)
│   │   ├── help/           # Customer support FAQ & warranty policies
│   │   ├── login/          # Supabase Auth modal & login view
│   │   ├── profile/        # Customer orders history & profile management
│   │   ├── reset-password/ # Password recovery handler
│   │   ├── shop/           # Filterable, sortable product catalog grid
│   │   ├── story/          # Sustainable pine wood sourcing & Kashmir heritage
│   │   ├── layout.tsx      # Root HTML shell, Lenis scroll, Navbar & Footer
│   │   └── page.tsx        # Homepage (Hero, 3D Atelier, Curated Drops)
│   ├── components/
│   │   ├── 3d/             # Three.js R3F Canvas components & lighting rigs
│   │   ├── admin/          # Metric cards, lifecycle modals, live ticker
│   │   ├── auth/           # Login/Signup modal dialogs
│   │   ├── cart/           # Slide-out Cart Drawer with optimistic counters
│   │   ├── layout/         # Persistent Navbar, Footer, Navigation overlays
│   │   ├── providers/      # AuthProvider, ToastProvider, Hydration guards
│   │   └── ui/             # Reusable design tokens (buttons, badges, inputs)
│   ├── hooks/              # Custom React hooks (useScrollAnimation, media query)
│   ├── lib/                # API fetch client, Supabase client, Cashfree loader
│   └── stores/             # Zustand stores (cartStore, authStore)
├── next.config.ts          # Turbopack/Webpack configuration, CSP headers, CDN domains
├── package.json            # Scripts & dependencies
├── tailwind.config.ts      # Custom color palette, typography, animations
└── tsconfig.json           # Strict TypeScript configuration
```

---

## 🛠 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
```

### Environment Variables (`.env.local`)
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_CASHFREE_MODE=sandbox # or 'production'
BACKEND_URL=http://localhost:8000 # Server-side rewrites target
```

### Running the App
```bash
# Start Turbopack dev server (port 3000)
npm run dev

# Run TypeScript type verification
npx tsc --noEmit

# Test production build
npm run build
```

---

## 🛡 Security & Media Protection

* **Strict Content Security Policy (CSP)**: Blocks clickjacking via `frame-ancestors 'none'`, and isolates allowed scripts to Supabase and Cashfree domains.
* **Media Protection**: Intercepts unauthorized right-click context menus and drag-and-drop operations on bespoke product media and 3D canvases.

---

## 📄 License

Proprietary © 2026 **Dridha Crafts**. Handcrafted in the Kashmir Valley.
