-- CreateTable
CREATE TABLE "PostMetricSnapshot" (
    "postId" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "views" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "replies" INTEGER NOT NULL,
    "reposts" INTEGER NOT NULL,
    "quotes" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,

    PRIMARY KEY ("postId", "capturedAt"),
    CONSTRAINT "PostMetricSnapshot_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

