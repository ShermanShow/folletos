import http from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';

const publicDir = path.resolve(process.env.PUBLIC_DIR || '/app/public');
const dataDir = path.resolve(process.env.DATA_DIR || '/app/data');
const stateDir = path.join(dataDir, 'states');
const imageDir = path.join(dataDir, 'brochure-images');
const port = Number(process.env.PORT || 3000);
const authFile = path.join(dataDir, 'auth.json');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.pdf':'application/pdf'};
let credentials;

function json(res, code, body) {
  res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(body));
}

async function bodyBytes(req, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      req.resume();
      const error = new Error('Payload too large'); error.status = 413; throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function authorized(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded;
  try { decoded = Buffer.from(header.slice(6), 'base64').toString('utf8'); } catch { return false; }
  const split = decoded.indexOf(':');
  if (split < 0 || decoded.slice(0, split) !== credentials.user) return false;
  const actual = scryptSync(decoded.slice(split + 1), Buffer.from(credentials.salt, 'hex'), 32);
  const expected = Buffer.from(credentials.hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

function protect(req, res) {
  if (authorized(req)) return false;
  res.writeHead(401, {'WWW-Authenticate':'Basic realm="Folletos Huenú", charset="UTF-8"','Cache-Control':'no-store'});
  res.end('Acceso requerido');
  return true;
}

async function sendFile(res, file, cacheControl = 'no-cache') {
  let info;
  try { info = await stat(file); } catch { return json(res, 404, {error:'Not found'}); }
  if (!info.isFile()) return json(res, 404, {error:'Not found'});
  res.writeHead(200, {'Content-Type':mime[path.extname(file).toLowerCase()] || 'application/octet-stream','Content-Length':info.size,'Cache-Control':cacheControl,'X-Content-Type-Options':'nosniff'});
  createReadStream(file).pipe(res);
}

async function stateRoute(req, res, url) {
  const key = url.searchParams.get('key') || '';
  if (!/^[a-z0-9_-]{3,120}$/i.test(key)) return json(res, 400, {error:'Invalid state key'});
  const file = path.join(stateDir, key + '.json');
  if (req.method === 'GET') {
    try { return json(res, 200, JSON.parse(await readFile(file, 'utf8'))); }
    catch (error) { if (error.code === 'ENOENT') return json(res, 404, {state:null}); throw error; }
  }
  if (req.method !== 'PUT' && req.method !== 'POST') return json(res, 405, {error:'Method not allowed'});
  const body = JSON.parse((await bodyBytes(req, 8 * 1024 * 1024)).toString('utf8'));
  if (!body || !body.state || typeof body.state !== 'object' || Array.isArray(body.state)) return json(res, 400, {error:'Invalid state'});
  let previous = {};
  try { previous = JSON.parse(await readFile(file, 'utf8')).state || {}; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const next = {...body.state};
  for (const [eid, value] of Object.entries(next)) {
    if (value && value.__img && !value.src && previous[eid]?.src) next[eid] = {...previous[eid], ...value, src:previous[eid].src};
  }
  const temp = path.join(stateDir, `.${key}-${randomBytes(6).toString('hex')}.tmp`);
  try {
    await writeFile(temp, JSON.stringify({state:next,updatedAt:new Date().toISOString()}), {flag:'wx',mode:0o600});
    await rename(temp, file);
  } catch (error) { try { await import('node:fs/promises').then(fs => fs.unlink(temp)); } catch {} throw error; }
  return json(res, 200, {ok:true});
}

async function imageRoute(req, res, url) {
  if (req.method === 'GET') {
    const pathname = url.searchParams.get('path') || '';
    if (!/^brochure-images\/[a-z0-9_.-]+\.(png|jpe?g|webp|gif|svg)$/i.test(pathname)) return json(res, 400, {error:'Invalid image path'});
    return sendFile(res, path.join(dataDir, pathname), 'public, max-age=31536000, immutable');
  }
  if (req.method !== 'PUT' && req.method !== 'POST') return json(res, 405, {error:'Method not allowed'});
  const contentType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
  const extensions = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg'};
  const ext = extensions[contentType];
  if (!ext) return json(res, 415, {error:'Unsupported image type'});
  const bytes = await bodyBytes(req, 20 * 1024 * 1024);
  if (!bytes.length) return json(res, 400, {error:'Empty image'});
  const key = (url.searchParams.get('key') || 'image').replace(/[^a-z0-9_-]/gi, '_').slice(0, 100);
  const name = `${key}-${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
  await writeFile(path.join(imageDir, name), bytes, {flag:'wx',mode:0o600});
  return json(res, 200, {url:`/api/image?path=${encodeURIComponent('brochure-images/' + name)}`});
}

await mkdir(stateDir, {recursive:true,mode:0o700});
await mkdir(imageDir, {recursive:true,mode:0o700});
try { credentials = JSON.parse(await readFile(authFile, 'utf8')); }
catch { throw new Error('Missing auth.json. Refusing to start without authentication.'); }
if (!credentials.user || !credentials.salt || !credentials.hash) throw new Error('Invalid auth.json');

http.createServer(async (req, res) => {
  if (protect(req, res)) return;
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/state') return await stateRoute(req, res, url);
    if (url.pathname === '/api/image') return await imageRoute(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, {error:'Method not allowed'});
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { return json(res, 400, {error:'Invalid path'}); }
    const file = path.resolve(publicDir, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (file !== publicDir && !file.startsWith(publicDir + path.sep)) return json(res, 403, {error:'Forbidden'});
    return await sendFile(res, file);
  } catch (error) {
    console.error('request error:', error.message);
    return json(res, error.status || (error instanceof SyntaxError ? 400 : 500), {error:error.status === 413 ? 'Payload too large' : 'Request failed'});
  }
}).listen(port, '0.0.0.0', () => console.log(`Folletos ready on ${port}`));
