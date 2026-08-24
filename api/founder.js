import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const COOKIE = 'cardnal_founder_session';
const MAX_AGE = 60 * 60 * 24 * 7;

// Set FOUNDER_ROADMAP_PASSWORD and FOUNDER_ROADMAP_SESSION_SECRET in Vercel.
// Never place either value in this repository.

function cookieValue(req) {
  const cookies = String(req.headers.cookie || '').split(';');
  const entry = cookies.find((item) => item.trim().startsWith(`${COOKIE}=`));
  return entry ? decodeURIComponent(entry.trim().slice(COOKIE.length + 1)) : '';
}

function signature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function validSession(value, secret) {
  const [timestamp, mac] = String(value || '').split('.');
  if (!timestamp || !mac || !/^\d+$/.test(timestamp)) return false;
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (age < 0 || age > MAX_AGE) return false;
  const expected = signature(timestamp, secret);
  return mac.length === expected.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}

function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function passwordPage(error = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cardnal Founder Access</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0C0E;color:#F7F8F9;font-family:Arial,system-ui,sans-serif}.box{width:min(380px,calc(100% - 40px));padding:32px;border:1px solid #343940;border-radius:14px;background:#131519;box-shadow:0 20px 60px rgba(0,0,0,.28)}.mark{width:30px;height:30px;background:#E60B21;clip-path:polygon(100% 0,34% 30%,5% 100%,60% 73%,69% 57%,35% 62%,48% 51%,79% 34%)}h1{font-size:28px;letter-spacing:-.04em;margin:22px 0 8px}p{color:#C7CCD3;line-height:1.5}label{display:block;color:#C7CCD3;font-size:13px;font-weight:700;margin:20px 0 7px}input{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #6B727C;border-radius:10px;background:#0B0C0E;color:#F7F8F9;font-size:16px}button{width:100%;margin-top:12px;padding:13px;border:0;border-radius:10px;background:#E60B21;color:#fff;font-weight:700;font-size:15px;cursor:pointer}.error{color:#FF9BA6;font-size:13px}</style></head><body><main class="box"><div class="mark" aria-hidden="true"></div><h1>Founder operating map</h1><p>This private Cardnal page covers the web companion, Chrome extension, technology stack, SDLC, beta, launch, and open gaps.</p>${error ? `<p class="error">${htmlEscape(error)}</p>` : ''}<form method="post" action="/founder"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Open roadmap</button></form></main></body></html>`;
}

export default async function handler(req, res) {
  const secret = process.env.FOUNDER_ROADMAP_SESSION_SECRET;
  const password = process.env.FOUNDER_ROADMAP_PASSWORD;
  if (!secret || !password) return res.status(500).send('Founder page is not configured.');

  if (req.method === 'POST') {
    const supplied = String(req.body?.password || '');
    const expected = Buffer.from(password);
    const actual = Buffer.from(supplied);
    const matches = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    if (!matches) return res.status(401).setHeader('Content-Type', 'text/html; charset=utf-8').send(passwordPage('That password is not correct.'));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const token = `${timestamp}.${signature(timestamp, secret)}`;
    res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; Max-Age=${MAX_AGE}; Path=/founder; HttpOnly; Secure; SameSite=Lax`);
    return res.redirect(303, '/founder');
  }

  if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET, POST').send('Method not allowed');
  if (!validSession(cookieValue(req), secret)) return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(passwordPage());

  const file = await fs.readFile(path.join(process.cwd(), 'founder-roadmap.html'), 'utf8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(file);
}
