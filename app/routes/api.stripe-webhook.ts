import { stripe } from '~/lib/services/stripe.server'; // Adjust the import path as needed
import { createOrUpdateSubscription } from '~/actions/subscription';
import type { ClientActionFunctionArgs } from '@remix-run/react';
import type Stripe from 'stripe';

export const action = async ({ request }: ClientActionFunctionArgs) => {
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return Response.json({ error: 'Missing Stripe signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Use raw body for Stripe signature verification
    const rawBody = await request.text();

    event = await stripe.webhooks.constructEventAsync(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return Response.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscriptionId = session.subscription;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        const quantity = Number(session.metadata?.quantity) || 1;
        console.log('subscriptionId:', subscriptionId);
        if (!userId || !subscriptionId) {
          console.error('Missing user_id or invalid subscription ID in session metadata');
          return Response.json({ error: 'Invalid session data' }, { status: 400 });
        }

        await createOrUpdateSubscription({
          providerSubscriptionId: subscriptionId as any,
          userId,
          planType: 'basic', // Replace with your logic to determine plan type
          status: 'active', // Default to active; adjust based on your logic
          quantity,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(new Date().setDate(new Date().getDate() + 30)), // Example: 30 days
          priceId: priceId || null,
        });

        break;
      }

      // Handle other Stripe events if needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err: any) {
    console.error(`Error handling webhook event: ${err.message}`);
    return Response.json({ error: `Error handling webhook event: ${err.message}` }, { status: 500 });
  }
};
