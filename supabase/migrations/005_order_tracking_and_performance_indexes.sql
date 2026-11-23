-- ==============================================================================
-- Dridha Crafts - Migration 005: Order Tracking Fields & Performance Composite Indexes
-- ==============================================================================

-- 1. Add carrier, tracking_url, tracking_status_note, and delivered_at to orders
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS carrier VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS tracking_status_note VARCHAR(500),
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 2. Composite performance indexes
-- Filter user orders sorted by newest first
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
    ON orders(user_id, created_at DESC) 
    WHERE user_id IS NOT NULL;

-- Filter orders by status sorted by newest first (Admin dashboard pipeline)
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
    ON orders(status, created_at DESC);

-- Partial index for active products
CREATE INDEX IF NOT EXISTS idx_products_active 
    ON products(id, slug, category) 
    WHERE is_active = TRUE;

-- Partial index for active products by category
CREATE INDEX IF NOT EXISTS idx_products_active_category 
    ON products(category, created_at DESC) 
    WHERE is_active = TRUE;

-- Partial index for active reservations
CREATE INDEX IF NOT EXISTS idx_reservations_active 
    ON inventory_reservations(expires_at ASC) 
    WHERE status = 'reserved';

-- Reviews for product sorted by newest
CREATE INDEX IF NOT EXISTS idx_reviews_product_created 
    ON reviews(product_id, created_at DESC);
