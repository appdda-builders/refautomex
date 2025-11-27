import { NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripeClient;

const getStripe = () => {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  stripeClient = new Stripe(key, {
    apiVersion: '2024-06-20',
  });
  return stripeClient;
};

const generateFriendlyFolio = () => {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `P-${year}${month}${day}-${random}`;
};

const sanitizeLineItems = (lineItems = []) =>
  lineItems
    .map((item) => ({
      description: item.descripcion || item.description || 'Producto',
      price: Number(item.precio),
      quantity: Number(item.quantity) || 1,
      metadata: item.metadata || {},
    }))
    .filter((item) => Number.isFinite(item.price) && item.price > 0 && item.quantity > 0)
    .map((item) => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: item.description,
          metadata: Object.fromEntries(
            Object.entries(item.metadata).map(([key, value]) => [key, String(value ?? '')])
          ),
        },
        unit_amount: Math.round(item.price),
      },
      quantity: Math.round(item.quantity),
    }));

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';

  const lineItems = sanitizeLineItems(payload?.lineItems);
  if (!lineItems.length) {
    return NextResponse.json({ error: 'EMPTY_CART' }, { status: 400 });
  }

  const friendlyFolio = generateFriendlyFolio();
  const contact = payload?.contact || {};
  const orderContext = payload?.orderContext || {};

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      phone_number_collection: { enabled: true },
      success_url: `${origin}/section/shopping?lang=es&status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/section/shopping?lang=es&status=cancelled`,
      metadata: {
        friendlyFolio,
        fulfillmentStatus: 'en_proceso',
        fulfillmentCompleted: 'false',
        fulfillmentReturn: 'none',
        fulfillmentNote: '',
        contactAddress: contact.address || '',
        contactName: contact.name || '',
        contactEmail: contact.email || '',
        orderUserId: orderContext.userId ? String(orderContext.userId) : '',
        orderType: orderContext.orderType || 'W',
        paymentMethodId: orderContext.paymentMethodId
          ? String(orderContext.paymentMethodId)
          : '3',
        orderNotes: orderContext.notes || '',
      },
      customer_email: contact.email || undefined,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      friendlyFolio,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return NextResponse.json(
      { error: 'STRIPE_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
