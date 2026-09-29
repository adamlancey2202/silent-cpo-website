CREATE TABLE "ContentEntry" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "slug" TEXT,
    "publishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentEntry_slug_key" ON "ContentEntry"("slug");
CREATE INDEX "ContentEntry_kind_status_updatedAt_idx" ON "ContentEntry"("kind", "status", "updatedAt");
CREATE TABLE "ContentRun" (
    "id" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "topicId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentRun_requestKey_key" ON "ContentRun"("requestKey");
