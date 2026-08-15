-- CreateTable
CREATE TABLE "FollowerSnapshot" (
    "accountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "followersCount" INTEGER NOT NULL,
    "demographics" JSONB,
    "capturedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowerSnapshot_pkey" PRIMARY KEY ("accountId","date")
);

-- AddForeignKey
ALTER TABLE "FollowerSnapshot" ADD CONSTRAINT "FollowerSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ThreadsAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
