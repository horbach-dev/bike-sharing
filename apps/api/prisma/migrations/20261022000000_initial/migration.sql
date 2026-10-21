CREATE TYPE "ScooterStatus" AS ENUM ('AVAILABLE', 'IN_RIDE', 'PARKED', 'MAINTENANCE', 'OFFLINE');
CREATE TYPE "RideStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ListingCategory" AS ENUM ('BIKE_SALE', 'BIKE_RENTAL', 'HOUSING_RENTAL');
CREATE TYPE "SubscriptionType" AS ENUM ('HOUSING_TOP', 'BIKE_SALE_FEED');

CREATE TABLE "Scooter" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "model" TEXT NOT NULL DEFAULT 'Honda Lead 125',
  "year" INTEGER NOT NULL,
  "plate" TEXT,
  "status" "ScooterStatus" NOT NULL DEFAULT 'AVAILABLE',
  "batteryPercent" INTEGER,
  "fuelPercent" INTEGER,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "locationUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Scooter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ride" (
  "id" TEXT NOT NULL,
  "scooterId" TEXT NOT NULL,
  "status" "RideStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "startLatitude" DOUBLE PRECISION,
  "startLongitude" DOUBLE PRECISION,
  "endLatitude" DOUBLE PRECISION,
  "endLongitude" DOUBLE PRECISION,
  "distanceKm" DOUBLE PRECISION,
  "endRejected" BOOLEAN NOT NULL DEFAULT false,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParkingZone" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "polygon" JSONB NOT NULL,
  "isNoParking" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParkingZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentPage" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomePageSettings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "sections" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomePageSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Listing" (
  "id" TEXT NOT NULL,
  "category" "ListingCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "type" "SubscriptionType" NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopPlacement" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "category" "ListingCategory" NOT NULL,
  "position" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TopPlacement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Scooter_code_key" ON "Scooter"("code");
CREATE UNIQUE INDEX "Scooter_plate_key" ON "Scooter"("plate");
CREATE INDEX "Scooter_status_idx" ON "Scooter"("status");
CREATE INDEX "Ride_status_startedAt_idx" ON "Ride"("status", "startedAt");
CREATE INDEX "Ride_scooterId_startedAt_idx" ON "Ride"("scooterId", "startedAt");
CREATE INDEX "ParkingZone_active_isNoParking_idx" ON "ParkingZone"("active", "isNoParking");
CREATE UNIQUE INDEX "ContentPage_slug_key" ON "ContentPage"("slug");
CREATE INDEX "Listing_category_published_createdAt_idx" ON "Listing"("category", "published", "createdAt");
CREATE INDEX "Subscription_type_active_endsAt_idx" ON "Subscription"("type", "active", "endsAt");
CREATE INDEX "Subscription_listingId_active_idx" ON "Subscription"("listingId", "active");
CREATE UNIQUE INDEX "TopPlacement_category_position_startsAt_key" ON "TopPlacement"("category", "position", "startsAt");
CREATE INDEX "TopPlacement_position_active_startsAt_endsAt_idx" ON "TopPlacement"("position", "active", "startsAt", "endsAt");

ALTER TABLE "Ride" ADD CONSTRAINT "Ride_scooterId_fkey" FOREIGN KEY ("scooterId") REFERENCES "Scooter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TopPlacement" ADD CONSTRAINT "TopPlacement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
