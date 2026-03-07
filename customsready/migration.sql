-- prisma/migrations/0001_init/migration.sql
-- CustomsReady Lite initial schema migration

-- Session (Shopify session storage)
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Session_shop_idx" ON "Session"("shop");

-- Installation
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "billingStatus" TEXT NOT NULL DEFAULT 'pending',
    "planName" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Installation_shopDomain_key" ON "Installation"("shopDomain");
CREATE INDEX "Installation_shopDomain_idx" ON "Installation"("shopDomain");

-- Configuration
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "sellerName" TEXT,
    "sellerAddressLine1" TEXT,
    "sellerAddressLine2" TEXT,
    "sellerCity" TEXT,
    "sellerStateProvince" TEXT,
    "sellerPostalCode" TEXT,
    "sellerCountryCode" TEXT,
    "sellerContactEmail" TEXT,
    "sellerContactPhone" TEXT,
    "homeCountry" TEXT,
    "defaultCurrency" TEXT,
    "exemptTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Configuration_shopDomain_key" ON "Configuration"("shopDomain");
CREATE INDEX "Configuration_shopDomain_idx" ON "Configuration"("shopDomain");

-- ProductAuditRecord
CREATE TABLE "ProductAuditRecord" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "hasHsCode" BOOLEAN NOT NULL DEFAULT false,
    "hasCoo" BOOLEAN NOT NULL DEFAULT false,
    "harmonizedSystemCode" TEXT,
    "countryCodeOfOrigin" TEXT,
    "fixStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "orderCount30d" INTEGER NOT NULL DEFAULT 0,
    "lastAuditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductAuditRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductAuditRecord_shopDomain_variantId_key"
    ON "ProductAuditRecord"("shopDomain", "variantId");
CREATE INDEX "ProductAuditRecord_shopDomain_idx"
    ON "ProductAuditRecord"("shopDomain");
CREATE INDEX "ProductAuditRecord_shopDomain_hasHsCode_idx"
    ON "ProductAuditRecord"("shopDomain", "hasHsCode");
CREATE INDEX "ProductAuditRecord_shopDomain_hasCoo_idx"
    ON "ProductAuditRecord"("shopDomain", "hasCoo");
CREATE INDEX "ProductAuditRecord_shopDomain_fixStatus_idx"
    ON "ProductAuditRecord"("shopDomain", "fixStatus");
CREATE INDEX "ProductAuditRecord_shopDomain_orderCount30d_idx"
    ON "ProductAuditRecord"("shopDomain", "orderCount30d" DESC);
CREATE INDEX "ProductAuditRecord_shopDomain_productId_idx"
    ON "ProductAuditRecord"("shopDomain", "productId");

-- AuditRun
CREATE TABLE "AuditRun" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "triggeredBy" TEXT NOT NULL DEFAULT 'manual',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "totalVariants" INTEGER NOT NULL DEFAULT 0,
    "processedVariants" INTEGER NOT NULL DEFAULT 0,
    "missingHs" INTEGER NOT NULL DEFAULT 0,
    "missingCoo" INTEGER NOT NULL DEFAULT 0,
    "missingBoth" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuditRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditRun_shopDomain_idx" ON "AuditRun"("shopDomain");
CREATE INDEX "AuditRun_shopDomain_status_idx" ON "AuditRun"("shopDomain", "status");
CREATE INDEX "AuditRun_shopDomain_createdAt_idx"
    ON "AuditRun"("shopDomain", "createdAt" DESC);

-- PdfGenerationLog
CREATE TABLE "PdfGenerationLog" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT,
    "completenessStatus" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PdfGenerationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PdfGenerationLog_shopDomain_idx"
    ON "PdfGenerationLog"("shopDomain");
CREATE INDEX "PdfGenerationLog_shopDomain_orderId_idx"
    ON "PdfGenerationLog"("shopDomain", "orderId");
CREATE INDEX "PdfGenerationLog_shopDomain_generatedAt_idx"
    ON "PdfGenerationLog"("shopDomain", "generatedAt" DESC);
