import { NextResponse } from 'next/server';

const REMOTE_API_BASE =
  process.env.REFAUTOMEX_API_BASE ||
  process.env.NEXT_PUBLIC_REFAPI_URL ||
  'http://refautomex-calidad.com/api';

const sanitizeBase = (url) => url.replace(/\/$/, '');

const remoteBase = sanitizeBase(REMOTE_API_BASE);

const buildRemoteUrl = (segments = [], searchParams) => {
  const joinedPath = segments.join('/');
  const query = searchParams?.toString();
  return `${remoteBase}/${joinedPath}${query ? `?${query}` : ''}`;
};

export async function GET(request, { params }) {
  const { path = [] } = params;
  const targetUrl = buildRemoteUrl(path, request.nextUrl.searchParams);

  try {
    const response = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const body =
      contentType.includes('application/json')
        ? await response.text()
        : await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'REFAPI_FETCH_FAILED',
        message: error.message,
      },
      { status: 502 }
    );
  }
}
