-- AlterTable
ALTER TABLE "OAuthClient" ADD COLUMN "authorizedAt" TIMESTAMPTZ(3);

-- Backfill: clients that already hold tokens were authorized at first issuance.
UPDATE "OAuthClient" c
SET "authorizedAt" = t."firstToken"
FROM (
  SELECT "clientId", MIN("createdAt") AS "firstToken"
  FROM "OAuthToken"
  GROUP BY "clientId"
) t
WHERE t."clientId" = c."id";

-- AlterTable
ALTER TABLE "OAuthToken" ADD COLUMN "familyId" TEXT,
ADD COLUMN "rotatedAt" TIMESTAMPTZ(3);

UPDATE "OAuthToken" SET "familyId" = "id";

ALTER TABLE "OAuthToken" ALTER COLUMN "familyId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "OAuthToken_familyId_idx" ON "OAuthToken"("familyId");
