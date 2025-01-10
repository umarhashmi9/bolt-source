import { createOrUpdateSubscription } from '~/actions/subscription';
import { stripe } from '../lib/services/stripe.server';
import type { SubscriptionStatus } from '@prisma/client';
import type { Request } from 'express';

export async function action(req: Request, res: Response) {
  const sig = req.headers['stripe-signature']; //

  let event;

  try {
    event = stripe.webhooks.constructEvent(req?.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err) {
    res;
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const subscription_id = session.subscription;
      const user_id = session.metadata?.user_id;
      const priceId = session.metadata?.price_id;
      const quantity = Number(session.metadata?.quantity);
      if (!user_id) {
        return;
      }
      return await createOrUpdateSubscription({
        providerSubscriptionId: typeof subscription_id === 'string' ? subscription_id : '',
        userId: user_id,
        planType: 'basic',
        status: 'active' as SubscriptionStatus,
        quantity: quantity || 1,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setDate(new Date().getDate() + 30)),
        priceId: priceId || null,
      });

      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // res.json({ received: true });
}
