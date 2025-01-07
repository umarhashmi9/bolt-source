-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('basic', 'pro');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('one_time', 'recurring');

-- CreateEnum
CREATE TYPE "PricingPlanInterval" AS ENUM ('day', 'week', 'month', 'year');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionId" TEXT;

-- CreateTable
CREATE TABLE "subscriptions" (
    "subscriptionId" TEXT NOT NULL,
    "providerSubscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    "status" "SubscriptionStatus",
    "quantity" INTEGER,
    "priceId" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "cancelAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscriptionId")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT,
    "unitAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "pricingPlanInterval" "PricingPlanInterval" NOT NULL,
    "intervalCount" INTEGER NOT NULL,
    "type" "PlanType" NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_userId_key" ON "customers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "products_productId_key" ON "products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "prices_priceId_key" ON "prices"("priceId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
