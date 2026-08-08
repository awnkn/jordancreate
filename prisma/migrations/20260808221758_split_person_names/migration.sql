-- Split single person-name columns into firstName / lastName, preserving any
-- existing rows by splitting on the first space.

-- Speaker ------------------------------------------------------------------
ALTER TABLE "Speaker" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Speaker" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
UPDATE "Speaker" SET
  "firstName" = split_part(btrim("name"), ' ', 1),
  "lastName"  = btrim(substr(btrim("name"), length(split_part(btrim("name"), ' ', 1)) + 2));
ALTER TABLE "Speaker" DROP COLUMN "name";
ALTER TABLE "Speaker" ALTER COLUMN "firstName" DROP DEFAULT;
ALTER TABLE "Speaker" ALTER COLUMN "lastName" DROP DEFAULT;

-- Guest --------------------------------------------------------------------
ALTER TABLE "Guest" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Guest" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
UPDATE "Guest" SET
  "firstName" = split_part(btrim("name"), ' ', 1),
  "lastName"  = btrim(substr(btrim("name"), length(split_part(btrim("name"), ' ', 1)) + 2));
ALTER TABLE "Guest" DROP COLUMN "name";
ALTER TABLE "Guest" ALTER COLUMN "firstName" DROP DEFAULT;
ALTER TABLE "Guest" ALTER COLUMN "lastName" DROP DEFAULT;

-- Person -------------------------------------------------------------------
ALTER TABLE "Person" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Person" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
UPDATE "Person" SET
  "firstName" = split_part(btrim("name"), ' ', 1),
  "lastName"  = btrim(substr(btrim("name"), length(split_part(btrim("name"), ' ', 1)) + 2));
ALTER TABLE "Person" DROP COLUMN "name";
ALTER TABLE "Person" ALTER COLUMN "firstName" DROP DEFAULT;
ALTER TABLE "Person" ALTER COLUMN "lastName" DROP DEFAULT;

-- Sponsor contact (nullable) ----------------------------------------------
ALTER TABLE "Sponsor" ADD COLUMN "contactFirstName" TEXT;
ALTER TABLE "Sponsor" ADD COLUMN "contactLastName" TEXT;
UPDATE "Sponsor" SET
  "contactFirstName" = split_part(btrim("contactName"), ' ', 1),
  "contactLastName"  = NULLIF(btrim(substr(btrim("contactName"), length(split_part(btrim("contactName"), ' ', 1)) + 2)), '')
WHERE "contactName" IS NOT NULL;
ALTER TABLE "Sponsor" DROP COLUMN "contactName";

-- Ticket buyer -------------------------------------------------------------
ALTER TABLE "TicketOrder" ADD COLUMN "buyerFirstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TicketOrder" ADD COLUMN "buyerLastName" TEXT NOT NULL DEFAULT '';
UPDATE "TicketOrder" SET
  "buyerFirstName" = split_part(btrim("buyerName"), ' ', 1),
  "buyerLastName"  = btrim(substr(btrim("buyerName"), length(split_part(btrim("buyerName"), ' ', 1)) + 2));
ALTER TABLE "TicketOrder" DROP COLUMN "buyerName";
ALTER TABLE "TicketOrder" ALTER COLUMN "buyerFirstName" DROP DEFAULT;
ALTER TABLE "TicketOrder" ALTER COLUMN "buyerLastName" DROP DEFAULT;
