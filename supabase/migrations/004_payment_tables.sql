-- ==============================================================================
-- Dridha Crafts - Migration 004: Payment Tables
-- Creates durable payment, payment_attempt, and payment_event tables for Cashfree
-- ==============================================================================

-- 1. payments: one Cashfree order/session per record linked to internal order
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    gateway VARCHAR(50) NOT NULL DEFAULT 'cashfree',
    environment VARCHAR(20) NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    merchant_order_id VARCHAR(100) NOT NULL,
    cf_order_id VARCHAR(100),
    payment_session_id VARCHAR(255),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'initiating' 
        CHECK (status IN ('initiating', 'active', 'paid', 'expired', 'failed', 'terminated', 'initiation_failed')),
    idempotency_key VARCHAR(100),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payments_gateway_merchant_order UNIQUE (gateway, merchant_order_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_cf_order 
    ON payments(gateway, cf_order_id) 
    WHERE cf_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 2. payment_attempts: individual provider payment transactions
CREATE TABLE IF NOT EXISTS payment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    cf_payment_id VARCHAR(100),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'success', 'failed', 'cancelled', 'user_dropped')),
    provider_status VARCHAR(50),
    payment_amount NUMERIC(10, 2) NOT NULL CHECK (payment_amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(30) NOT NULL,
    bank_reference VARCHAR(100),
    payment_message TEXT,
    error_code VARCHAR(100),
    error_message TEXT,
    payment_time TIMESTAMPTZ,
    payment_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_attempts_cf_payment_id 
    ON payment_attempts(cf_payment_id) 
    WHERE cf_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment_id ON payment_attempts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment_status ON payment_attempts(payment_status);

-- 3. payment_events: webhook / event audit records
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    payment_attempt_id UUID REFERENCES payment_attempts(id) ON DELETE SET NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'cashfree',
    event_type VARCHAR(100) NOT NULL,
    webhook_version VARCHAR(20),
    cf_event_id VARCHAR(100),
    payload_hash VARCHAR(64) NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
    processing_status VARCHAR(30) NOT NULL DEFAULT 'received'
        CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed')),
    payload JSONB,
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_attempt_id ON payment_events(payment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_payload_hash ON payment_events(payload_hash);
CREATE INDEX IF NOT EXISTS idx_payment_events_processing_status ON payment_events(processing_status);

-- 4. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payments_timestamp ON payments;
CREATE TRIGGER set_payments_timestamp
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_timestamp();

DROP TRIGGER IF EXISTS set_payment_attempts_timestamp ON payment_attempts;
CREATE TRIGGER set_payment_attempts_timestamp
    BEFORE UPDATE ON payment_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_timestamp();

-- 5. Row-Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Customers can view their own payments'
    ) THEN
        CREATE POLICY "Customers can view their own payments"
            ON payments FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM orders
                    WHERE orders.id = payments.order_id
                    AND orders.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payment_attempts' AND policyname = 'Customers can view their own payment attempts'
    ) THEN
        CREATE POLICY "Customers can view their own payment attempts"
            ON payment_attempts FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM payments
                    JOIN orders ON orders.id = payments.order_id
                    WHERE payments.id = payment_attempts.payment_id
                    AND orders.user_id = auth.uid()
                )
            );
    END IF;
END $$;

