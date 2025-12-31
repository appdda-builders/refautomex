import { NextResponse } from 'next/server';
import getStripe from '../stripe-client';

const DEFAULT_STATUS = 'en_proceso';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const { sessionId, status, complete, reset } = body || {};
  if (!sessionId) {
    return NextResponse.json({ error: 'MISSING_SESSION' }, { status: 400 });
  }

  let metadata = null;
  if (reset) {
    metadata = {
      fulfillmentStatus: DEFAULT_STATUS,
      fulfillmentCompleted: 'false',
      fulfillmentReturn: 'none',
      fulfillmentNote: '',
    };
  } else if (complete) {
    metadata = {
      fulfillmentStatus: 'en_camino',
      fulfillmentCompleted: 'true',
    };
  } else if (status) {
    metadata = {
      fulfillmentStatus: status,
      fulfillmentCompleted: 'false',
    };
  }

  if (!metadata) {
    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
  }

  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.update(sessionId, { metadata });
    return NextResponse.json({
      fulfillmentStatus: session.metadata?.fulfillmentStatus || DEFAULT_STATUS,
      fulfillmentNote: session.metadata?.fulfillmentNote || null,
      fulfillmentCompleted: session.metadata?.fulfillmentCompleted === 'true',
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json(
      { error: 'STATUS_UPDATE_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
