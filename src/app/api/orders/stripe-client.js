import Stripe from 'stripe';

let stripeClient;

export const getStripe = () => {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  stripeClient = new Stripe(key, {
    apiVersion: '2024-06-20',
  });
  return stripeClient;
};

export default getStripe;
