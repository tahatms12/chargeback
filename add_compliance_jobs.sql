-- Migration: add compliance_jobs table
-- Run: alembic upgrade head (or apply manually)
-- Rollback: DROP TABLE compliance_jobs;

CREATE TABLE IF NOT EXISTS compliance_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type        VARCHAR(50)  NOT NULL,    -- data_request | customers_redact | shop_redact
    shop_domain     VARCHAR(255) NOT NULL,
    external_id     VARCHAR(255),             -- Shopify request_id or shop_domain (idempotency key)
    customer_shopify_id VARCHAR(255),
    customer_email  VARCHAR(255),
    status          VARCHAR(50)  NOT NULL DEFAULT 'pending',  -- pending | pending_s3 | completed | failed
    payload         JSONB,
    sla_deadline    TIMESTAMPTZ,
    records_affected INTEGER DEFAULT 0,
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_jobs_shop
    ON compliance_jobs (shop_domain);

CREATE INDEX IF NOT EXISTS idx_compliance_jobs_type_status
    ON compliance_jobs (job_type, status);

-- Unique constraint for idempotency: one record per external_id per job_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_jobs_idempotency
    ON compliance_jobs (job_type, external_id)
    WHERE external_id IS NOT NULL;

COMMENT ON TABLE compliance_jobs IS
    'Audit and tracking table for Shopify GDPR compliance webhooks. SLA tracked via sla_deadline.';
