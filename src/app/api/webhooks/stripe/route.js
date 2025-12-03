import { NextResponse } from 'next/server';
import buildApiUrl from '@/app/lib/refautomex-api';
import getStripe from '../../orders/stripe-client';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const getBaseUrl = () =>
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const formatCurrency = (value) => Number(value || 0).toFixed(2);

const mapLineItems = (lineItems) =>
  lineItems.data.map((item) => {
    const metadata = item.price?.product?.metadata || {};
    const quantity = Number(metadata.cantidad) || item.quantity || 1;
    const unitPrice = Number(metadata.precio) || (item.amount_total || 0) / 100 / quantity;
    const subtotal = unitPrice * quantity;
    return {
      refaccion: metadata.refaccion || item.description || 'WEB',
      descripcion: metadata.descripcion || item.description || 'Producto',
      cantidad: quantity,
      aIva: formatCurrency(metadata.aIva || unitPrice / 1.16),
      precio: formatCurrency(metadata.precio || unitPrice),
      monto: formatCurrency(metadata.monto || subtotal),
      existencia: Number(metadata.existencia) || 0,
      isSeminew: metadata.isSeminew === 'S' ? 'S' : 'N',
      isEditable: metadata.isEditable === 'true',
      isPedido: metadata.isPedido === 'false' ? false : true,
    };
  });

const persistSale = async (salePayload) => {
  const endpoint = `${getBaseUrl()}${buildApiUrl('/newSale')}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(salePayload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to persist sale: ${response.status} ${text}`);
  }
  return response.json();
};

const handleCheckoutCompleted = async (session) => {
  if (session.metadata?.saleRecorded === 'true') return;
  const stripe = await getStripe();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ['data.price.product'],
  });
  const items = mapLineItems(lineItems);
  if (!items.length) {
    throw new Error('No line items found for session.');
  }

  const metadata = session.metadata || {};
  const amountTotal = (session.amount_total || 0) / 100;
  const now = new Date();
  const fechaVenta = now.toISOString().split('T')[0];
  const entregaDate = new Date(now);
  entregaDate.setDate(now.getDate() + 3);
  const salePayload = {
    fecha_venta: fechaVenta,
    total_venta: formatCurrency(amountTotal),
    idusuario: Number(metadata.orderUserId) || 1,
    tipo: metadata.orderType || 'W',
    idmetodo: Number(metadata.paymentMethodId) || 3,
    items: items.map((item) => ({
      ...item,
      aIva: formatCurrency(item.aIva),
      precio: formatCurrency(item.precio),
      monto: formatCurrency(item.monto),
    })),
    telefono: session.customer_details?.phone || '',
    email: session.customer_details?.email || metadata.contactEmail || '',
    fecha_entrega: entregaDate.toISOString().split('T')[0],
    fecha_pedido: fechaVenta,
    nombre_cliente:
      metadata.contactName || session.customer_details?.name || 'Cliente Web Stripe',
    isOrder: true,
    notas: metadata.orderNotes || 'Pedido web (Stripe)',
  };

  const result = await persistSale(salePayload);
  if (result?.folio) {
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...metadata,
        friendlyFolio: result.folio,
        saleRecorded: 'true',
      },
    });
  }
};

export async function POST(request) {
  if (!WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured when handling Stripe webhook');
    return NextResponse.json({ error: 'WEBHOOK_SECRET_NOT_CONFIGURED' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 400 });
  }

  let event;
  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'WEBHOOK_PROCESSING_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
