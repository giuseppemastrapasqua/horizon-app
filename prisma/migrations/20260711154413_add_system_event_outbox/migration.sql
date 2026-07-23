-- CreateTable
CREATE TABLE "SystemEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT,
    "source" "SystemEventSource" NOT NULL DEFAULT 'HORIZON',
    "status" "SystemEventStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "externalEventId" TEXT,
    "correlationId" TEXT,
    "causationId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemEvent_idempotencyKey_key" ON "SystemEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SystemEvent_status_availableAt_idx" ON "SystemEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "SystemEvent_eventType_idx" ON "SystemEvent"("eventType");

-- CreateIndex
CREATE INDEX "SystemEvent_aggregateType_aggregateId_idx" ON "SystemEvent"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "SystemEvent_source_idx" ON "SystemEvent"("source");

-- CreateIndex
CREATE INDEX "SystemEvent_externalEventId_idx" ON "SystemEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "SystemEvent_correlationId_idx" ON "SystemEvent"("correlationId");

-- CreateIndex
CREATE INDEX "SystemEvent_createdAt_idx" ON "SystemEvent"("createdAt");
