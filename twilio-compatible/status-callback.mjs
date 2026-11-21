// A StatusCallback receiver, the same as one written for Twilio: Sparetext posts Twilio's form
// fields (MessageSid, MessageStatus, ErrorCode, ...) and signs them in X-Twilio-Signature. The one
// change: check the signature with your Sparetext callback secret where Twilio's code uses the
// Auth Token. Node 18 or newer, with the twilio package from package.json.
//
//   export SPARETEXT_CALLBACK_SECRET=whsec_...   # Webhooks page, "Callback secret"
//   export PUBLIC_URL=https://your-tunnel.example/status   # the URL you give as StatusCallback
//   node status-callback.mjs
import { createServer } from "node:http";
import twilio from "twilio";

const port = Number(process.env.PORT ?? 3000);
const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${port}/status`;

createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const params = Object.fromEntries(new URLSearchParams(raw));
  // validateRequest needs the URL exactly as it was called, query string included.
  const url = new URL(req.url, publicUrl).href;
  if (!twilio.validateRequest(process.env.SPARETEXT_CALLBACK_SECRET, req.headers["x-twilio-signature"] ?? "", url, params)) {
    res.writeHead(403).end("Bad signature");
    return;
  }
  const failure = params.ErrorCode ? ` (error ${params.ErrorCode})` : "";
  console.log(`${params.MessageSid} to ${params.To}: ${params.MessageStatus}${failure}`);
  res.writeHead(204).end();
}).listen(port, () => console.log(`Listening for status callbacks at ${publicUrl}`));
