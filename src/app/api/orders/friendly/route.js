import { NextResponse } from 'next/server';
import { findSessionByFriendlyFolio } from '../utils';

export async function GET(request) {
  const folio = request.nextUrl.searchParams.get('folio');
  if (!folio) {
    return NextResponse.json({ error: 'MISSING_FOLIO' }, { status: 400 });
  }

  try {
    const order = await findSessionByFriendlyFolio(folio);
    if (!order) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({
      id: order.id,
      friendlyFolio: order.friendlyFolio,
      paymentStatus: order.status,
      amount: order.amount,
      currency: order.currency,
      items: order.lineItems,
      created: order.created,
      email: order.email,
      fulfillmentStatus: order.fulfillmentStatus,
      fulfillmentCompleted: order.isCompleted,
      fulfillmentReturn: order.fulfillmentReturn,
      fulfillmentNote: order.fulfillmentNote,
      contactPhone: order.contactPhone,
      contactAddress: order.contactAddress,
    });
  } catch (error) {
    console.error('Error searching folio:', error);
    return NextResponse.json(
      { error: 'FIND_BY_FOLIO_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
