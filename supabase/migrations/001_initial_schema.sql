-- ============================================================
-- Dridha Crafts — Initial Database Schema
-- Supabase PostgreSQL Migration
-- ============================================================
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- USERS (Extended profile — auth handled by Supabase Auth)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id     VARCHAR(255) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    role        VARCHAR(20) NOT NULL DEFAULT 'customer',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ──────────────────────────────────────────────────────────────
-- ADDRESSES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    address_line_1  VARCHAR(255) NOT NULL,
    address_line_2  VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pincode         VARCHAR(10) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- ──────────────────────────────────────────────────────────────
-- PRODUCTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    slug                VARCHAR(200) UNIQUE NOT NULL,
    short_description   VARCHAR(500) NOT NULL DEFAULT '',
    long_description    TEXT,
    category            VARCHAR(100) NOT NULL,
    price               NUMERIC(10, 2) NOT NULL,
    compare_at_price    NUMERIC(10, 2),
    wood_type           VARCHAR(100) NOT NULL DEFAULT 'Walnut',
    finish              VARCHAR(100) NOT NULL DEFAULT 'Classic',
    weight_kg           NUMERIC(5, 2),
    dimensions          VARCHAR(200),
    care_instructions   TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    stock_quantity      INTEGER NOT NULL DEFAULT 0,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ──────────────────────────────────────────────────────────────
-- PRODUCT IMAGES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url   VARCHAR(500) NOT NULL,
    alt_text    VARCHAR(255) NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- ──────────────────────────────────────────────────────────────
-- PRODUCT VARIANTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name    VARCHAR(100) NOT NULL,
    variant_type    VARCHAR(50) NOT NULL,
    price_override  NUMERIC(10, 2),
    stock_quantity  INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- ──────────────────────────────────────────────────────────────
-- BUNDLES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bundles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) UNIQUE NOT NULL,
    description     VARCHAR(500) NOT NULL DEFAULT '',
    price           NUMERIC(10, 2) NOT NULL,
    original_price  NUMERIC(10, 2) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    image_url       VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bundles_slug ON bundles(slug);

-- ──────────────────────────────────────────────────────────────
-- BUNDLE ITEMS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bundle_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id   UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);

-- ──────────────────────────────────────────────────────────────
-- CART ITEMS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity    INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- ──────────────────────────────────────────────────────────────
-- ORDERS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number            VARCHAR(20) UNIQUE NOT NULL,
    user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
    shipping_name           VARCHAR(100) NOT NULL,
    shipping_phone          VARCHAR(20) NOT NULL,
    shipping_address_line_1 VARCHAR(255) NOT NULL,
    shipping_address_line_2 VARCHAR(255),
    shipping_city           VARCHAR(100) NOT NULL,
    shipping_state          VARCHAR(100) NOT NULL,
    shipping_pincode        VARCHAR(10) NOT NULL,
    subtotal                NUMERIC(10, 2) NOT NULL,
    shipping_cost           NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount                NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total                   NUMERIC(10, 2) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_method          VARCHAR(20) NOT NULL,
    payment_status          VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes                   TEXT,
    tracking_number         VARCHAR(100),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ──────────────────────────────────────────────────────────────
-- ORDER ITEMS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name    VARCHAR(200) NOT NULL,
    product_slug    VARCHAR(200) NOT NULL,
    variant_name    VARCHAR(100),
    price           NUMERIC(10, 2) NOT NULL,
    quantity        INTEGER NOT NULL,
    total           NUMERIC(10, 2) NOT NULL,
    image_url       VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ──────────────────────────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- ──────────────────────────────────────────────────────────────
-- WISHLIST
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- ── Public Read Policies (anyone can browse products) ────────
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read product_images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read product_variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public read bundles" ON bundles FOR SELECT USING (true);
CREATE POLICY "Public read bundle_items" ON bundle_items FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);

-- ── User Self-Access Policies ────────────────────────────────
-- Users can only access their own data
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid()::text = auth_id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid()::text = auth_id);

CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
);

CREATE POLICY "Users manage own cart" ON cart_items FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
);

CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
);

CREATE POLICY "Users read own order_items" ON order_items FOR SELECT USING (
    order_id IN (
        SELECT id FROM orders WHERE user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()::text
        )
    )
);

CREATE POLICY "Users create own orders" ON orders FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
);

CREATE POLICY "Users create order_items" ON order_items FOR INSERT WITH CHECK (
    order_id IN (
        SELECT id FROM orders WHERE user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()::text
        )
    )
);

CREATE POLICY "Users write own reviews" ON reviews FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
);

CREATE POLICY "Users delete own reviews" ON reviews FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
);

CREATE POLICY "Users manage own wishlist" ON wishlist FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
);

-- ── Service Role (Backend) has full access by default ────────
-- The service_role key bypasses RLS, so the FastAPI backend
-- can perform admin operations (create products, update orders, etc.)

-- ──────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- SEED DATA — Initial Product Catalog
-- ──────────────────────────────────────────────────────────────

INSERT INTO products (name, slug, short_description, long_description, category, price, compare_at_price, wood_type, finish, weight_kg, is_active, is_featured, stock_quantity, sort_order) VALUES
(
    'Fixed Laptop Stand',
    'fixed-laptop-stand',
    'Elevate your workspace with this handcrafted wooden laptop stand. Designed for stability, airflow, and ergonomic comfort.',
    'Handcrafted from sustainably sourced Kashmiri walnut wood, this fixed laptop stand raises your screen to eye level, reducing neck strain during long work sessions. The natural wood grain makes every piece unique. Fits laptops up to 15.6 inches.',
    'Laptop Stands',
    539.00,
    NULL,
    'Walnut',
    'Classic',
    0.80,
    TRUE, TRUE, 20, 1
),
(
    'Signature Fixed Laptop Stand',
    'signature-fixed-laptop-stand',
    'Premium variant with hand-finished signature detailing. A statement piece for the discerning professional.',
    'Our signature edition features additional hand-rubbed oil finish and refined edge detailing. Each piece is individually inspected for quality. The deeper wood tone develops a beautiful patina over time.',
    'Laptop Stands',
    599.00,
    NULL,
    'Walnut',
    'Signature',
    0.80,
    TRUE, FALSE, 15, 2
),
(
    'ShiftDesk Stand',
    'shiftdesk-stand',
    'Adjustable multi-angle laptop stand with 6 height levels. Switch between typing and presentation modes effortlessly.',
    'The ShiftDesk Stand offers 6 adjustable angle positions from 18° to 58°, allowing you to find the perfect viewing angle. Crafted from solid walnut with precision-cut adjustment slots. Folds flat for easy storage.',
    'Laptop Stands',
    649.00,
    NULL,
    'Walnut',
    'Classic',
    0.80,
    TRUE, TRUE, 15, 3
),
(
    'Signature ShiftDesk Stand',
    'signature-shiftdesk-stand',
    'Premium adjustable stand with signature finishing. The ultimate ergonomic companion for your desk.',
    'Combines the versatility of our ShiftDesk design with premium signature finishing. Hand-rubbed oil finish, refined edges, and deeper wood tones that age beautifully.',
    'Laptop Stands',
    749.00,
    NULL,
    'Walnut',
    'Signature',
    0.80,
    TRUE, FALSE, 10, 4
),
(
    'Mobile Stand',
    'mobile-stand',
    'Compact wooden phone stand that keeps your device at the perfect viewing angle. Natural and minimal.',
    'A beautifully minimal phone stand carved from a single piece of walnut. The precise angle keeps your phone visible during video calls or media viewing. Compatible with all phone sizes.',
    'Phone Stands',
    349.00,
    NULL,
    'Walnut',
    'Classic',
    0.20,
    TRUE, TRUE, 30, 5
),
(
    'Cable Holder',
    'cable-holder',
    'Magnetic wooden cable organizer that keeps your desk clutter-free. Three magnetic slots for different cables.',
    'Tired of cables sliding off your desk? This magnetic cable holder uses embedded magnets with removable wooden pegs to keep up to 3 cables neatly organized. The two-tone wood design adds elegance to any workspace.',
    'Desk Organizers',
    299.00,
    NULL,
    'Walnut',
    'Classic',
    0.15,
    TRUE, FALSE, 25, 6
),
(
    'Headphone Stand',
    'headphone-stand',
    'Sculptural wooden headphone stand that doubles as desk art. Keeps your headphones safe and beautifully displayed.',
    'This sculptural headphone stand is as much a work of art as it is functional. Hand-carved from solid walnut, the organic curves cradle your headphones while adding a touch of warmth to your workspace.',
    'Audio Accessories',
    549.00,
    NULL,
    'Walnut',
    'Classic',
    0.50,
    TRUE, TRUE, 15, 7
),
(
    'Tablet Stand',
    'tablet-stand',
    'Multi-angle bamboo tablet stand. Perfect for drawing, reading, or video calls. Folds flat for portability.',
    'A versatile tablet stand with multiple viewing angles. Made from sustainably sourced wood, it supports tablets of all sizes in both portrait and landscape orientations. Folds completely flat for travel.',
    'Tablet Stands',
    449.00,
    NULL,
    'Walnut',
    'Classic',
    0.40,
    TRUE, FALSE, 20, 8
),
(
    'Bookends',
    'bookends',
    'Pair of solid wooden bookends with stunning natural grain patterns. Each pair is one-of-a-kind.',
    'These substantial bookends are cut from solid hardwood, showcasing the beautiful natural grain patterns unique to each piece. Heavy enough to support a full shelf of books while adding warmth to any room.',
    'Desk Decor',
    599.00,
    NULL,
    'Walnut',
    'Classic',
    0.60,
    TRUE, FALSE, 10, 9
);

-- ── Bundles ──────────────────────────────────────────────────
INSERT INTO bundles (name, slug, description, price, original_price, is_active, is_featured) VALUES
(
    'Work From Home Set',
    'work-from-home-set',
    'Everything you need for a productive home office: Fixed Laptop Stand + Mobile Stand + Cable Holder. Save ₹188!',
    999.00,
    1187.00,
    TRUE, TRUE
),
(
    'Signature WFH Set',
    'signature-wfh-set',
    'Premium work-from-home bundle: Signature Fixed Laptop Stand + Mobile Stand + Cable Holder. Save ₹148!',
    1099.00,
    1247.00,
    TRUE, FALSE
),
(
    'ShiftDesk WFH Set',
    'shiftdesk-wfh-set',
    'Adjustable work-from-home bundle: ShiftDesk Stand + Mobile Stand + Cable Holder. Save ₹198!',
    1099.00,
    1297.00,
    TRUE, TRUE
),
(
    'Signature ShiftDesk WFH Set',
    'signature-shiftdesk-wfh-set',
    'Premium adjustable bundle: Signature ShiftDesk Stand + Mobile Stand + Cable Holder. Save ₹198!',
    1199.00,
    1397.00,
    TRUE, FALSE
);

-- Link bundles to products (using subqueries for the product IDs)
INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'work-from-home-set' AND p.slug = 'fixed-laptop-stand';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'work-from-home-set' AND p.slug = 'mobile-stand';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'work-from-home-set' AND p.slug = 'cable-holder';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'signature-wfh-set' AND p.slug = 'signature-fixed-laptop-stand';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'signature-wfh-set' AND p.slug = 'mobile-stand';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'signature-wfh-set' AND p.slug = 'cable-holder';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'shiftdesk-wfh-set' AND p.slug = 'shiftdesk-stand';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'shiftdesk-wfh-set' AND p.slug = 'mobile-stand';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'shiftdesk-wfh-set' AND p.slug = 'cable-holder';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'signature-shiftdesk-wfh-set' AND p.slug = 'signature-shiftdesk-stand';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'signature-shiftdesk-wfh-set' AND p.slug = 'mobile-stand';

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, p.id, 1
FROM bundles b, products p
WHERE b.slug = 'signature-shiftdesk-wfh-set' AND p.slug = 'cable-holder';

-- ──────────────────────────────────────────────────────────────
-- DONE! Your Dridha Crafts database is ready.
-- ──────────────────────────────────────────────────────────────
