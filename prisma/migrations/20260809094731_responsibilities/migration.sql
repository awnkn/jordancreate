CREATE TABLE "Responsibility" (
    "id" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'Owner',
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personId" TEXT NOT NULL,
    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Responsibility_personId_fkey" FOREIGN KEY ("personId")
      REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Responsibility_personId_idx" ON "Responsibility"("personId");
