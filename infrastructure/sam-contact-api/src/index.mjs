// src/index.mjs
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({});

function isHuman(body) {
  // Minimal spam checks: honeypot empty, token present if Turnstile enabled, elapsed time > 3s
  if (body.company) return false;
  const startTime = Number(body.startTime || 0);
  if (!isNaN(startTime) && Date.now() - startTime < 3000) return false;
  return true;
}

async function verifyTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token })
    });
    const out = await r.json();
    return !!out.success;
  } catch (e) { return false; }
}

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.requestContext.http.method !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ message: 'Invalid JSON' }) }; }

  if (!isHuman(body)) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: 'Spam detected' }) };
  }
  if (!body.firstName || !body.lastName || !body.email) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing required fields' }) };
  }
  if (process.env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(body.turnstileToken || body["cf-turnstile-response"]);
    if (!ok) return { statusCode: 400, headers, body: JSON.stringify({ message: 'Captcha failed' }) };
  }

  const from = process.env.FROM_EMAIL;
  const to = process.env.TO_EMAIL;
  const subject = `Website inquiry from ${body.firstName} ${body.lastName}`;
  const text = `Name: ${body.firstName} ${body.lastName}
Email: ${body.email}
Phone: ${body.phone || ''}
Message: ${body.message || ''}
Page: ${body.page || ''}
`;
  const html = `<p><strong>Name:</strong> ${body.firstName} ${body.lastName}</p>
<p><strong>Email:</strong> ${body.email}</p>
<p><strong>Phone:</strong> ${body.phone || ''}</p>
<p><strong>Message:</strong><br>${(body.message||'').replace(/\n/g,'<br>')}</p>
<p><em>Page:</em> ${body.page || ''}</p>`;

  try {
    await ses.send(new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: text }, Html: { Data: html } }
      },
      Source: from,
      ReplyToAddresses: [body.email]
    }));
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Your message was sent. Thank you!' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Unable to send email at this time.' }) };
  }
};
