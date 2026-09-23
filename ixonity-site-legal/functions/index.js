export function onRequestGet({ request }) {
  const url = new URL(request.url);
  url.pathname = request.cf?.country === 'UA' ? '/ua/' : '/en/';
  return new Response(null, {
    status: 302,
    headers: {
      'Location': url.toString(),
      'Cache-Control': 'private, no-store, max-age=0',
      'Vary': 'CF-IPCountry'
    }
  });
}
