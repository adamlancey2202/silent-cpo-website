-- Delivery tracker for the admin project tool.
CREATE TABLE "StudioClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioClient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudioProject" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "projectType" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'enquiry',
    "budget" TEXT NOT NULL DEFAULT '',
    "agreedCost" TEXT NOT NULL DEFAULT '',
    "amountPaid" TEXT NOT NULL DEFAULT '',
    "paymentType" TEXT NOT NULL DEFAULT 'money',
    "paymentNotes" TEXT NOT NULL DEFAULT '',
    "deadline" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "whatDoing" TEXT NOT NULL DEFAULT '',
    "discoveryFeedback" TEXT NOT NULL DEFAULT '',
    "quoteText" TEXT NOT NULL DEFAULT '',
    "quoteFilename" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudioTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TEXT NOT NULL DEFAULT '',
    "phase" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudioProject_status_updatedAt_idx" ON "StudioProject"("status", "updatedAt");
CREATE INDEX "StudioProject_clientId_idx" ON "StudioProject"("clientId");
CREATE INDEX "StudioTask_projectId_status_sortOrder_idx" ON "StudioTask"("projectId", "status", "sortOrder");

ALTER TABLE "StudioProject" ADD CONSTRAINT "StudioProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "StudioClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudioTask" ADD CONSTRAINT "StudioTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
