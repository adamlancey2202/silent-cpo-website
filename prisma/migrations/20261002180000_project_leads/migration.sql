-- Project finder queue. n8n inserts rows; admin reviews and sends email.
CREATE TABLE "ProjectLead" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "score" INTEGER NOT NULL,
    "budget" TEXT NOT NULL DEFAULT '',
    "why" TEXT NOT NULL DEFAULT '',
    "reply" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'new',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectLead_url_key" ON "ProjectLead"("url");
CREATE INDEX "ProjectLead_status_createdAt_idx" ON "ProjectLead"("status", "createdAt");
