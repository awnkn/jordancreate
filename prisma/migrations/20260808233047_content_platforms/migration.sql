-- Free-text channel becomes a platforms array; known values are mapped.
ALTER TABLE "ContentPiece" ADD COLUMN "platforms" TEXT[] NOT NULL DEFAULT '{}';
UPDATE "ContentPiece" SET "platforms" = CASE
  WHEN "channel" IS NULL THEN '{}'::TEXT[]
  WHEN "channel" ILIKE '%email%' OR "channel" ILIKE '%newsletter%' THEN ARRAY['Newsletter']
  WHEN "channel" ILIKE '%journal%' OR "channel" ILIKE '%website%' OR "channel" ILIKE '%blog%' THEN ARRAY['Website']
  WHEN "channel" ILIKE '%instagram%' THEN ARRAY['Instagram']
  WHEN "channel" ILIKE '%youtube%' THEN ARRAY['YouTube']
  WHEN "channel" ILIKE '%tiktok%' THEN ARRAY['TikTok']
  WHEN "channel" ILIKE '%linkedin%' THEN ARRAY['LinkedIn']
  ELSE ARRAY["channel"]
END;
ALTER TABLE "ContentPiece" DROP COLUMN "channel";
