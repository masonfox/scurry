// Authentication utilities for session management

/**
 * Determines if the current connection is secure (HTTPS) based on request headers and URL.
 * Supports both direct HTTPS connections and reverse proxy scenarios.
 * 
 * @param {import('next/server').NextRequest} request - The Next.js request object
 * @returns {boolean} True if the connection is secure (HTTPS), false otherwise
 */
export function isSecureConnection(request) {
  // Check x-forwarded-proto header (set by reverse proxies/load balancers)
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  // Fall back to checking the URL protocol directly
  return request.url.startsWith('https://');
}
