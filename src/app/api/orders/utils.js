import getStripe from './stripe-client';

const parseBoolean = (value) =>
  value === true || value === 'true' || value === 1 || value === '1';

const normalizeReturnStatus = (value) => (value === 'devolucion' ? 'devolucion' : null);

const buildLineItems = (raw) =>
  (raw?.data || []).map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    total: item.amount_total,
    currency: item.currency,
  }));

export const formatOrderFromSession = (session, rawLineItems) => {
  const metadata = session.metadata || {};
  const lineItems = buildLineItems(rawLineItems);
  const contactEmail =
    metadata.contactEmail || session.customer_details?.email || session.customer_email || null;
  const contactPhone = metadata.contactPhone || session.customer_details?.phone || null;

  return {
    id: session.id,
    email: contactEmail,
    status: session.payment_status,
    amount: session.amount_total || 0,
    created: session.created || Math.floor(Date.now() / 1000),
    currency: session.currency || 'mxn',
    friendlyFolio: metadata.friendlyFolio || null,
    fulfillmentStatus: metadata.fulfillmentStatus || 'en_proceso',
    isCompleted: parseBoolean(metadata.fulfillmentCompleted),
    fulfillmentReturn: normalizeReturnStatus(metadata.fulfillmentReturn),
    fulfillmentNote: metadata.fulfillmentNote || null,
    contactPhone,
    contactAddress: metadata.contactAddress || null,
    contactEmail,
    contactName: metadata.contactName || null,
    lineItems,
  };
};

export const fetchOrderSummary = async (sessionId) => {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
  return formatOrderFromSession(session, lineItems);
};

export const listOrders = async (limit = 25) => {
  const stripe = getStripe();
  const sessions = await stripe.checkout.sessions.list({
    limit,
    expand: ['data.total_details', 'data.customer'],
  });
  const summaries = await Promise.all(
    sessions.data.map(async (session) => {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      return formatOrderFromSession(session, lineItems);
    })
  );
  return summaries;
};

export const findSessionByFriendlyFolio = async (folio) => {
  if (!folio) return null;
  const normalized = folio.trim().toUpperCase();
  const stripe = getStripe();
  try {
    const result = await stripe.checkout.sessions.search({
      query: `metadata['friendlyFolio']:'${normalized}'`,
      limit: 1,
    });
    const hit = result?.data?.[0];
    if (hit) {
      const lineItems = await stripe.checkout.sessions.listLineItems(hit.id, { limit: 100 });
      return formatOrderFromSession(hit, lineItems);
    }
  } catch (error) {
    console.warn('Stripe search not available, falling back to manual scan.', error.message);
  }

  const sessions = await stripe.checkout.sessions.list({ limit: 100 });
  const match = sessions.data.find(
    (session) => (session.metadata?.friendlyFolio || '').toUpperCase() === normalized
  );
  if (!match) return null;
  const lineItems = await stripe.checkout.sessions.listLineItems(match.id, { limit: 100 });
  return formatOrderFromSession(match, lineItems);
};
