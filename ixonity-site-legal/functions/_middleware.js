export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname.toLowerCase() === 'www.ixonity.dev') {
    url.hostname = 'ixonity.dev';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
