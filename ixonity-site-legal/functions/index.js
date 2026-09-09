export function onRequestGet({ request }) {
  const url = new URL(request.url);
  url.pathname = request.cf?.country === 'UA' ? '/ua/' : '/en/';
  return Response.redirect(url.toString(), 302);
}
