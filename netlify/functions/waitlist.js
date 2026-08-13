// POST /api/waitlist  ->  inserts into the Supabase `waitlist` table.
//
// The service-role key lives ONLY here, in the Netlify environment.
// It is never sent to the browser.
//
// Required environment variables (Netlify > Site settings > Environment variables):
//   SUPABASE_URL               e.g. https://abcdefghijkl.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  the service_role secret from Supabase > Project Settings > API

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// naive in-memory throttle; per-container, resets on cold start.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const ip =
    (event.headers['x-nf-client-connection-ip'] ||
     event.headers['x-forwarded-for'] ||
     'unknown').split(',')[0].trim();

  if (rateLimited(ip)) {
    return json(429, { error: 'Too many attempts. Try again in a minute.' });
  }

  let email;
  try {
    email = String(JSON.parse(event.body || '{}').email || '').trim().toLowerCase();
  } catch {
    return json(400, { error: 'Send a JSON body with an email field.' });
  }

  if (!email)                 return json(400, { error: 'Enter your email to join the waitlist.' });
  if (email.length > 254)     return json(400, { error: 'That email is too long.' });
  if (!EMAIL_RE.test(email))  return json(400, { error: 'That email doesn\u2019t look right.' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return json(500, { error: 'Server is not configured yet.' });
  }

  try {
    const res = await fetch(`${url}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      const [row] = await res.json();
      return json(201, { ok: true, id: row?.id, created_at: row?.created_at });
    }

    const detail = await res.json().catch(() => ({}));

    // 23505 = unique_violation -> this email already signed up
    if (res.status === 409 || detail.code === '23505') {
      return json(409, { error: 'This email is already on the waitlist.' });
    }

    console.error('Supabase insert failed', res.status, detail);
    return json(502, { error: 'Could not save your spot. Try again shortly.' });
  } catch (err) {
    console.error('Waitlist request failed', err);
    return json(502, { error: 'Could not save your spot. Try again shortly.' });
  }
}
