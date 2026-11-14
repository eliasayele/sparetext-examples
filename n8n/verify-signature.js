// n8n Code node (JavaScript, Run Once for All Items), right after the Webhook node.
// Stops the run unless the request is signed by Sparetext within the last 5 minutes.
// Self-hosted n8n: set NODE_FUNCTION_ALLOW_BUILTIN=crypto and restart.
const crypto = require('crypto');
const secret = 'YOUR_SIGNING_SECRET'; // Sparetext › Webhooks › Details and signing secret
const { headers, body } = $input.first().json;
const header = String(headers['x-sparetext-signature'] ?? '');
const t = /(?:^|,)t=(\d+)/.exec(header)?.[1];
// Sparetext sends compact JSON, so turning the parsed body back into JSON gives the bytes it signed.
const signed = `${t}.${JSON.stringify(body)}`;
const want = Buffer.from(crypto.createHmac('sha256', secret).update(signed).digest('hex'));
// For a day after a secret rotation there are two v1= signatures: either may be yours.
const given = [...header.matchAll(/v1=([0-9a-f]{64})/g)].map(([, v1]) => Buffer.from(v1));
const fresh = !!t && Math.abs(Date.now() / 1000 - Number(t)) <= 300;
if (!fresh || !given.some((v1) => crypto.timingSafeEqual(want, v1))) {
  throw new Error('This request did not come from Sparetext.');
}
return $input.all();
