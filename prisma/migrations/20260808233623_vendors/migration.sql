CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Supplier',
    "contactFirstName" TEXT,
    "contactLastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Prospect',
    "service" TEXT,
    "spaceName" TEXT,
    "monthlyRent" DOUBLE PRECISION,
    "leaseStart" TIMESTAMP(3),
    "leaseEnd" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Vendor_kind_idx" ON "Vendor"("kind");
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");
ALTER TABLE "Interaction" ADD COLUMN "vendorId" TEXT;
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Interaction_vendorId_idx" ON "Interaction"("vendorId");
