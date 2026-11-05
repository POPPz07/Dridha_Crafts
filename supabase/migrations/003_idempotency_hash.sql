-- ==============================================================================
-- Dridha Crafts - Migration 003: Add Idempotency Hash
-- Stores SHA-256 canonical request payload hash for idempotency validation
-- ==============================================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS idempotency_hash VARCHAR(64);

