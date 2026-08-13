const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// This throttle is intentionally lightweight. Vercel may run multiple instances,
// so it is only a first layer of abuse protection, not a global rate limiter.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function respond(res, status, body) {
  res.status(status);
  res.setHeader('Cache-Control', 'no-store');
  return res.json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return respond(res, 405, { error: 'Method not allowed' });
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (rateLimited(ip)) {
    return respond(res, 429, { error: 'Too many attempts. Try again in a minute.' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();

  if (!email) {
    return respond(res, 400, { error: 'Enter your email to join the waitlist.' });
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return respond(res, 400, { error: 'That email doesn’t look right.' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return respond(res, 500, { error: 'Server is not configured yet.' });
  }

  try {
    const response = await fetch(`${url}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const [row] = await response.json();
      return respond(res, 201, {
        ok: true,
        id: row?.id,
        created_at: row?.created_at,
      });
    }

    const detail = await response.json().catch(() => ({}));
    if (response.status === 409 || detail.code === '23505') {
      return respond(res, 409, { error: 'This email is already on the waitlist.' });
    }

    console.error('Supabase insert failed', response.status, detail);
    return respond(res, 502, { error: 'Could not save your spot. Try again shortly.' });
  } catch (error) {
    console.error('Waitlist request failed', error);
    return respond(res, 502, { error: 'Could not save your spot. Try again shortly.' });
  }
}
