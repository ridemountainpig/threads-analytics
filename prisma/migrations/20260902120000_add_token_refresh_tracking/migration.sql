-- AlterTable
ALTER TABLE "ThreadsAccount" ADD COLUMN     "tokenRefreshedAt" TIMESTAMPTZ(3),
ADD COLUMN     "tokenCheckedAt" TIMESTAMPTZ(3);
