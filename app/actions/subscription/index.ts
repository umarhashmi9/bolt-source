import { SubscriptionStatus, type PlanType, type subscriptions } from '@prisma/client';
import db from '../prisma';


type ISubscription = {
  providerSubscriptionId: string,
  userId: string,
  planType: PlanType,
  status: SubscriptionStatus,
  quantity: number,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  priceId: string | null,
}

export function createOrUpdateSubscription(sub: ISubscription) {
  const subscription = db.subscriptions.upsert({
    where: {
      userId: sub.userId
    },
    create: {
      ...sub
    },
    update: {
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      providerSubscriptionId: sub.providerSubscriptionId,
      quantity: sub.quantity,
      status: "active",
      priceId: sub.priceId,
      planType: sub.planType
    }
  })
  return subscription
}