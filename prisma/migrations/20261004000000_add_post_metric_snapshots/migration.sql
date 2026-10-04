-- CreateTable
CREATE TABLE "PostMetricSnapshot" (
    "postId" TEXT NOT NULL,
    "capturedAt" TIMESTAMPTZ(3) NOT NULL,
    "views" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "replies" INTEGER NOT NULL,
    "reposts" INTEGER NOT NULL,
    "quotes" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,

    CONSTRAINT "PostMetricSnapshot_pkey" PRIMARY KEY ("postId","capturedAt")
);

-- AddForeignKey
ALTER TABLE "PostMetricSnapshot" ADD CONSTRAINT "PostMetricSnapshot_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

