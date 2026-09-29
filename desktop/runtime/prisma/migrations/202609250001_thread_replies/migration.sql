-- AlterTable
ALTER TABLE "SyncState" ADD COLUMN "repliesSyncedAt" DATETIME;

-- CreateTable
CREATE TABLE "ThreadReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "rootPostId" TEXT NOT NULL,
    "repliedToId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "gapSeconds" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "mediaType" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "reposts" INTEGER NOT NULL DEFAULT 0,
    "quotes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThreadReply_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ThreadsAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ThreadReply_rootPostId_fkey" FOREIGN KEY ("rootPostId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ThreadReply_rootPostId_position_idx" ON "ThreadReply"("rootPostId", "position");

-- CreateIndex
CREATE INDEX "ThreadReply_accountId_timestamp_idx" ON "ThreadReply"("accountId", "timestamp");

