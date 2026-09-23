export function onRequestGet({ request }) {
  const market = request.cf?.country === 'UA' ? 'ua' : 'global';
  return Response.json({ market }, {
    headers: {
      'Cache-Control':'private, no-store, max-age=0',
      'Vary':'CF-IPCountry',
      'X-Robots-Tag':'noindex'
    }
  });
}
