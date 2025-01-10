import { stripe } from '~/lib/services/stripe.server'; // Adjust the import path as needed
import type { ClientActionFunctionArgs } from '@remix-run/react';
import { getCustomerByUserId, saveStripeCustomerId } from '../actions/user';
export const action = async ({ request }: ClientActionFunctionArgs) => {
  const { userId }: { userId: string } = await request.json();

  if (!userId) {
    return Response.json({ error: 'User not authenticated' }, { status: 401 });
  }

  let customer = await getCustomerByUserId(userId);

  if (!customer?.customerIs) {
    try {
      // Create a new Stripe customer if none exists
      const newCustomer = await stripe.customers.create({
        metadata: {
          user_id: userId, // Attach your user ID for tracking
        },
      });

      // Save the new customer ID in your database
      customer = await saveStripeCustomerId(userId, newCustomer.id);

      if (!customer) {
        throw new Error('Failed to save Stripe customer ID');
      }
    } catch (err: any) {
      console.error(`Error creating Stripe customer: ${err.message}`);
      return Response.json({ error: 'Unable to create Stripe customer' }, { status: 500 });
    }
  }

  try {
    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.customerIs as string,

      return_url: process.env.BILLING_RETURN_URL || 'http://localhost:5173', // Replace with your desired return URL
    });

    // Respond with the portal URL
    return Response.json({ url: portalSession.url });
  } catch (err: any) {
    console.error(`Error creating Billing Portal session: ${err.message}`);
    return Response.json({ error: 'Unable to create Billing Portal session' }, { status: 500 });
  }
};
