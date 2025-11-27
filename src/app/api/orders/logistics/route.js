import { NextResponse } from 'next/server';
import getStripe from '../stripe-client';

const normalizeReturn = (value) => (value === 'devolucion' ? 'devolucion' : null);

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const { sessionId, note, returnStatus } = body || {};
  if (!sessionId) {
    return NextResponse.json({ error: 'MISSING_SESSION' }, { status: 400 });
  }

  const metadata = {};
  if (note !== undefined) metadata.fulfillmentNote = note || '';
  if (returnStatus !== undefined) {
    metadata.fulfillmentReturn = returnStatus === 'devolucion' ? 'devolucion' : 'none';
  }

  if (!Object.keys(metadata).length) {
    return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.update(sessionId, { metadata });
    return NextResponse.json({
      note: session.metadata?.fulfillmentNote || null,
      returnStatus: normalizeReturn(session.metadata?.fulfillmentReturn),
    });
  } catch (error) {
    console.error('Error updating logistics metadata:', error);
    return NextResponse.json(
      { error: 'LOGISTICS_UPDATE_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
