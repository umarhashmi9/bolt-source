import { stripe } from '../lib/services/stripe.server'; // Adjust the import path as necessary
// or your server framework

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Fulfill the purchase...
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}