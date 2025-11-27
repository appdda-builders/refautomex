import { NextResponse } from 'next/server';
import { fetchOrderSummary } from '../utils';

export async function GET(request) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'MISSING_SESSION' }, { status: 400 });
  }
  try {
    const summary = await fetchOrderSummary(sessionId);
    return NextResponse.json({ friendlyFolio: summary.friendlyFolio, id: summary.id });
  } catch (error) {
    console.error('Error fetching session folio:', error);
    return NextResponse.json(
      { error: 'FOLIO_LOOKUP_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
