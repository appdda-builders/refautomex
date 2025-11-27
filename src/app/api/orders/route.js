import { NextResponse } from 'next/server';
import { listOrders } from './utils';

export async function GET(request) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = Number(limitParam) || 25;
  try {
    const orders = await listOrders(Math.max(1, Math.min(limit, 100)));
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching Stripe sessions:', error);
    return NextResponse.json(
      { error: 'FETCH_ORDERS_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
