// Receive the texts your phone gets as signed webhooks. Node 18 or newer, no packages.
//
//   export SPARETEXT_WEBHOOK_SECRET=whsec_...   # Webhooks > your webhook > Details and signing secret
//   node webhook-receiver.mjs                   # listens on http://localhost:3000
//
// Sparetext posts to a public https URL, so put this behind your own domain or a tunnel,
// and add that URL on the Webhooks page with the Text received event.

import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

/** rawBody: the request body exactly as it arrived (a string or Buffer). */
function fromSparetext(rawBody, header, secret) {
  header = String(header ?? "");
  const t = /(?:^|,)t=(\d+)/.exec(header)?.[1];
  if (!t || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // refuse replays older than 5 minutes
  const want = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"));
  // For a day after you rotate the secret there are two v1= signatures: either may be yours.
  return [...header.matchAll(/v1=([0-9a-f]{64})/g)].some(([, v1]) => timingSafeEqual(want, Buffer.from(v1)));
}

const secret = process.env.SPARETEXT_WEBHOOK_SECRET;
const port = Number(process.env.PORT ?? 3000);
const handled = new Set(); // keep event ids in your database instead

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks);
  if (!fromSparetext(raw, req.headers["x-sparetext-signature"], secret)) {
    res.writeHead(401).end();
    return;
  }
  res.writeHead(200).end(); // answer within 5 seconds, then do the work

  const event = JSON.parse(raw);
  if (handled.has(event.id)) return; // a retry of an event you already have
  handled.add(event.id);
  if (event.type === "message.received") {
    const { contact, text } = event.data.message;
    console.log(`Text from ${contact}: ${text}`);
  } else if (event.type === "message.delivered" || event.type === "message.failed") {
    const { id, status } = event.data.message;
    console.log(`${id} is ${status}`);
  } else {
    console.log(`Event: ${event.type}`);
  }
}).listen(port, () => console.log(`Listening on http://localhost:${port}`));
