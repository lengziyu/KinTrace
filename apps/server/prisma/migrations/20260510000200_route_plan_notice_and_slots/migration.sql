ALTER TABLE "RoutePlan"
ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "morningTombCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "afternoonTombCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "planRevision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "planUpdatedAt" TIMESTAMP(3);

UPDATE "RoutePlan"
SET
  "isPrimary" = true,
  "planUpdatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "id" IN (
  SELECT DISTINCT ON ("familyId") "id"
  FROM "RoutePlan"
  ORDER BY "familyId", "updatedAt" DESC
);
