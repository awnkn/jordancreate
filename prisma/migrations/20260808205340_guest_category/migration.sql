-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General Guests',
    "outlet" TEXT,
    "showName" TEXT,
    "format" TEXT NOT NULL DEFAULT 'Podcast',
    "status" TEXT NOT NULL DEFAULT 'Prospect',
    "email" TEXT,
    "phone" TEXT,
    "audienceSize" INTEGER,
    "scheduledFor" DATETIME,
    "publishedUrl" TEXT,
    "angle" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Guest" ("angle", "audienceSize", "createdAt", "email", "format", "id", "name", "notes", "outlet", "phone", "publishedUrl", "scheduledFor", "showName", "status", "updatedAt") SELECT "angle", "audienceSize", "createdAt", "email", "format", "id", "name", "notes", "outlet", "phone", "publishedUrl", "scheduledFor", "showName", "status", "updatedAt" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
CREATE INDEX "Guest_status_idx" ON "Guest"("status");
CREATE INDEX "Guest_category_idx" ON "Guest"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
