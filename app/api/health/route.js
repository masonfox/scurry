// Simple health check endpoint for Docker
export async function GET() {
  return new Response('OK', { status: 200 });
}
