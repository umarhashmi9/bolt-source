import type { AppLoadContext } from '@remix-run/cloudflare';

export function requireBasicAuth(request: Request, loadContext: AppLoadContext): Response | null {
  const authorization = request.headers.get('Authorization');

  if (!authorization) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  const [scheme, encoded] = authorization.split(' ');

  if (!encoded || scheme !== 'Basic') {
    return new Response('Unauthorized', { status: 401 });
  }

  const buffer = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  const decoded = new TextDecoder().decode(buffer).toString();
  const [username, password] = decoded.split(':');

  // @ts-ignore
  const BASIC_AUTH_USERNAME = loadContext.cloudflare.env?.BASIC_AUTH_USERNAME || process.env.BASIC_AUTH_USERNAME;
  // @ts-ignore
  const BASIC_AUTH_PASSWORD = loadContext.cloudflare.env?.BASIC_AUTH_PASSWORD || process.env.BASIC_AUTH_PASSWORD;

  if (username !== BASIC_AUTH_USERNAME || password !== BASIC_AUTH_PASSWORD) {
    return new Response('Unauthorized', { status: 401 });
  }

  return null;
}
