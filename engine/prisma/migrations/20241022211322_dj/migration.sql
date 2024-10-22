/*
  Warnings:

  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Trade";

-- CreateTable
CREATE TABLE "Buytrade" (
    "id" TEXT NOT NULL,
    "buyerAccountId" TEXT,
    "sellerAccountId" TEXT,
    "tradeQty" DOUBLE PRECISION,
    "buyPrice" DOUBLE PRECISION,
    "sellPrice" DOUBLE PRECISION,
    "buyerOrderId" TEXT,
    "sellerOrderId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buytrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Selltrade" (
    "id" TEXT NOT NULL,
    "sellerAccountId" TEXT,
    "tradeQty" DOUBLE PRECISION,
    "sellPrice" DOUBLE PRECISION,
    "sellerOrderId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Selltrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Buytrade_buyerAccountId_idx" ON "Buytrade"("buyerAccountId");

-- CreateIndex
CREATE INDEX "Buytrade_sellerAccountId_idx" ON "Buytrade"("sellerAccountId");

-- CreateIndex
CREATE INDEX "Buytrade_eventId_idx" ON "Buytrade"("eventId");

-- CreateIndex
CREATE INDEX "Selltrade_sellerAccountId_idx" ON "Selltrade"("sellerAccountId");

-- CreateIndex
CREATE INDEX "Selltrade_eventId_idx" ON "Selltrade"("eventId");
