import { put } from '@vercel/blob';
import { Readable } from 'node:stream';

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBytes(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const requestUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET') {
    const pathname = requestUrl.searchParams.get('path') || '';
    if (!/^brochure-images\/[a-z0-9_.-]+\.(png|jpe?g|webp|gif|svg)$/i.test(pathname)) return send(res, 400, { error: 'Invalid image path' });
    try {
      const blob = await (await import('@vercel/blob')).get(pathname, { access: 'private' });
      if (!blob) return send(res, 404, { error: 'Image not found' });
      const extension = (pathname.match(/\.(png|jpe?g|webp|gif|svg)$/i) || [])[1] || 'octet-stream';
      const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
      res.status(200).setHeader('Content-Type', types[extension.toLowerCase()] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return Readable.fromWeb(blob.stream).pipe(res);
    } catch (error) {
      console.error('image delivery error', error);
      return send(res, 404, { error: 'Image not found' });
    }
  }
  if (req.method !== 'PUT' && req.method !== 'POST') {
    res.setHeader('Allow', 'PUT, POST');
    return send(res, 405, { error: 'Method not allowed' });
  }
  try {
    const rawKey = requestUrl.searchParams.get('key') || 'image';
    const key = rawKey.replace(/[^a-z0-9_-]/gi, '_').slice(0, 120);
    const contentType = String(req.headers['content-type'] || 'image/jpeg').split(';')[0];
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(contentType)) return send(res, 415, { error: 'Unsupported image type' });
    const bytes = await readBytes(req);
    if (!bytes.length) return send(res, 400, { error: 'Empty image' });
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : contentType.includes('svg') ? 'svg' : 'jpg';
    const pathname = `brochure-images/${key}-${Date.now()}.${ext}`;
    const blob = await put(pathname, bytes, {
      access: 'private',
      addRandomSuffix: true,
      contentType,
      cacheControlMaxAge: '31536000',
    });
    return send(res, 200, { url: `/api/image?path=${encodeURIComponent(blob.pathname || pathname)}` });
  } catch (error) {
    console.error('image upload error', error);
    return send(res, 500, { error: 'Image upload unavailable' });
  }
}
