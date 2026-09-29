-- AlterTable
ALTER TABLE "ThreadsAccount" ADD COLUMN "tokenCheckedAt" DATETIME;
ALTER TABLE "ThreadsAccount" ADD COLUMN "tokenRefreshedAt" DATETIME;

-- CreateTable
CREATE TABLE "FollowerSnapshot" (
    "accountId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "followersCount" INTEGER NOT NULL,
    "demographics" JSONB,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("accountId", "date"),
    CONSTRAINT "FollowerSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ThreadsAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OAuthClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "redirectUris" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorizedAt" DATETIME
);

-- CreateTable
CREATE TABLE "OAuthCode" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "codeChallenge" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthCode_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "OAuthClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "accessExpiresAt" DATETIME NOT NULL,
    "refreshExpiresAt" DATETIME NOT NULL,
    "rotatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    CONSTRAINT "OAuthToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "OAuthClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_accessToken_key" ON "OAuthToken"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_refreshToken_key" ON "OAuthToken"("refreshToken");

-- CreateIndex
CREATE INDEX "OAuthToken_familyId_idx" ON "OAuthToken"("familyId");
