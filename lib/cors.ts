/**
 * CORS helper for API routes
 * Adds CORS headers to allow browser requests
 */
import { NextResponse } from 'next/server';

export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export function handleOptionsRequest() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

