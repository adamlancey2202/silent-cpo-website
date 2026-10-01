CREATE TABLE "ContentTopicPlanRun" (
    "id" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "topicIds" JSONB NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentTopicPlanRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTopicPlanRun_requestKey_key" ON "ContentTopicPlanRun"("requestKey");
