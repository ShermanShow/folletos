import { get, put } from '@vercel/blob';

function keyFromRequest(req) {
  const raw = new URL(req.url, `https://${req.headers.host || 'localhost'}`).searchParams.get('key') || '';
  if (!/^[a-z0-9_-]{3,120}$/i.test(raw)) return null;
  return `brochures/${raw}.json`;
}

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  const pathname = keyFromRequest(req);
  if (!pathname) return send(res, 400, { error: 'Invalid state key' });
  try {
    if (req.method === 'GET') {
      const result = await get(pathname, { access: 'private' });
      if (!result) return send(res, 404, { state: null });
      return send(res, 200, await new Response(result.stream).json());
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readBody(req);
      if (!body || typeof body.state !== 'object') return send(res, 400, { error: 'Invalid state' });
      // Never let a browser without its local IndexedDB (for example, Incognito)
      // erase an image that was already stored in the remote state.
      let nextState = body.state;
      const previous = await get(pathname, { access: 'private' });
      if (previous) {
        const previousBody = await new Response(previous.stream).json();
        const previousState = previousBody && previousBody.state;
        if (previousState && typeof previousState === 'object') {
          nextState = { ...body.state };
          for (const [key, value] of Object.entries(nextState)) {
            if (value && value.__img && !value.src && previousState[key] && previousState[key].src) {
              nextState[key] = { ...previousState[key], ...value, src: previousState[key].src };
            }
          }
        }
      }
      await put(pathname, JSON.stringify({ state: nextState, updatedAt: new Date().toISOString() }), {
          access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json'
      });
      return send(res, 200, { ok: true });
    }
    res.setHeader('Allow', 'GET, PUT, POST');
    return send(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('state api error', error);
    return send(res, 500, { error: 'State storage unavailable' });
  }
}
