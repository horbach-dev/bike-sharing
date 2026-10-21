CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LocationSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Scooter"
  ADD COLUMN "helmetCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "hasRainwear" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hasRemoteAccess" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AppUser" (
  "id" TEXT NOT NULL,
  "telegramId" TEXT,
  "phone" TEXT,
  "trips" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AppUser_telegramId_key" ON "AppUser"("telegramId");
CREATE INDEX "AppUser_trips_idx" ON "AppUser"("trips");
ALTER TABLE "Ride" ADD COLUMN "userId" TEXT;
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Story" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "posterUrl" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "description" TEXT,
  "linkUrl" TEXT,
  "linkLabel" TEXT,
  "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Story_status_publishedAt_sortOrder_idx" ON "Story"("status", "publishedAt", "sortOrder");

CREATE TABLE "Article" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "coverUrl" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'guide',
  "published" BOOLEAN NOT NULL DEFAULT false,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_published_featured_publishedAt_idx" ON "Article"("published", "featured", "publishedAt");

ALTER TABLE "Listing"
  ADD COLUMN "address" TEXT,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "areaSqm" DOUBLE PRECISION,
  ADD COLUMN "bedrooms" INTEGER,
  ADD COLUMN "bathrooms" INTEGER,
  ADD COLUMN "hasTv" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hasFridge" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hasTables" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "contact" TEXT,
  ADD COLUMN "promotedUntil" TIMESTAMP(3);

CREATE TABLE "Partner" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "websiteUrl" TEXT,
  "affiliateUrl" TEXT,
  "commissionNote" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

CREATE TABLE "ExchangeRate" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT,
  "baseCode" TEXT NOT NULL,
  "quoteCode" TEXT NOT NULL,
  "rate" DECIMAL(18,6) NOT NULL,
  "sourceLabel" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExchangeRate_active_baseCode_quoteCode_checkedAt_idx"
  ON "ExchangeRate"("active", "baseCode", "quoteCode", "checkedAt");
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LocationSubmission" (
  "id" TEXT NOT NULL,
  "telegramId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'place',
  "imageUrl" TEXT,
  "status" "LocationSubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LocationSubmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LocationSubmission_status_createdAt_idx" ON "LocationSubmission"("status", "createdAt");

CREATE TABLE "CashbackTier" (
  "id" TEXT NOT NULL,
  "minimumCompletedTrips" INTEGER NOT NULL,
  "cashbackPercent" DECIMAL(5,2) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CashbackTier_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CashbackTier_minimumCompletedTrips_key" ON "CashbackTier"("minimumCompletedTrips");
CREATE INDEX "CashbackTier_active_minimumCompletedTrips_idx" ON "CashbackTier"("active", "minimumCompletedTrips");
