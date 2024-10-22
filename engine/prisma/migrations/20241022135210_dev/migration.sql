-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "buyerAccountId" TEXT NOT NULL,
    "sellerAccountId" TEXT NOT NULL,
    "tradeQty" DOUBLE PRECISION NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "buyerOrderId" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_buyerAccountId_idx" ON "Trade"("buyerAccountId");

-- CreateIndex
CREATE INDEX "Trade_sellerAccountId_idx" ON "Trade"("sellerAccountId");

-- CreateIndex
CREATE INDEX "Trade_eventId_idx" ON "Trade"("eventId");
