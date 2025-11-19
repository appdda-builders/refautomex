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

const proxyRequest = async (method, request, context) => {
  const resolvedParams = (await context.params) || {};
  const { path = [] } = resolvedParams;
  const targetUrl = buildRemoteUrl(path, request.nextUrl.searchParams);

  try {
    const headers = new Headers(request.headers);
    headers.set('Accept', headers.get('Accept') || 'application/json, text/plain, */*');

    const init = {
      method,
      headers,
      cache: 'no-store',
    };

    if (method !== 'GET' && method !== 'HEAD') {
      init.body = await request.arrayBuffer();
    }

    const response = await fetch(targetUrl, init);
    const contentType = response.headers.get('content-type') || 'application/json';
    const bodyBuffer = await response.arrayBuffer();

    return new NextResponse(bodyBuffer, {
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
};

export async function GET(request, context) {
  return proxyRequest('GET', request, context);
}

export async function POST(request, context) {
  return proxyRequest('POST', request, context);
}

export async function PUT(request, context) {
  return proxyRequest('PUT', request, context);
}

export async function PATCH(request, context) {
  return proxyRequest('PATCH', request, context);
}

export async function DELETE(request, context) {
  return proxyRequest('DELETE', request, context);
}
