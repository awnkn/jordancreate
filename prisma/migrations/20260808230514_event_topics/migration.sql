-- Topic <-> Event many-to-many (implicit join table, Prisma naming).
CREATE TABLE "_EventToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EventToTopic_AB_pkey" PRIMARY KEY ("A", "B"),
    CONSTRAINT "_EventToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EventToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "_EventToTopic_B_index" ON "_EventToTopic"("B");
