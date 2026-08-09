ALTER TABLE "Person" ADD COLUMN "username" TEXT;
ALTER TABLE "Person" ADD COLUMN "passwordHash" TEXT;
CREATE UNIQUE INDEX "Person_username_key" ON "Person"("username");
