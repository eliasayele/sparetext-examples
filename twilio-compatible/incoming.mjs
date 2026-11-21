// An "A message comes in" handler, written as for Twilio: it checks X-Twilio-Signature with
// twilio.validateRequest and answers TwiML built with twilio's MessagingResponse. Sparetext posts
// each text your phone receives here (setup-incoming.sh makes the automation that does it), and
// texts the <Message> back to the sender from the same phone. The one change from Twilio: check
// the signature with the automation's secret where Twilio's code uses the Auth Token.
// Node 18 or newer, with the twilio package from package.json.
//
//   export SPARETEXT_AUTOMATION_SECRET=whsec_...   # the automation's "Signing secret"
//   export PUBLIC_URL=https://your-tunnel.example/sms   # the URL the automation calls
//   node incoming.mjs
import { createServer } from "node:http";
import twilio from "twilio";

const port = Number(process.env.PORT ?? 3000);
const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${port}/sms`;

createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const params = Object.fromEntries(new URLSearchParams(raw));
  // validateRequest needs the URL exactly as it was called, query string included.
  const url = new URL(req.url, publicUrl).href;
  if (!twilio.validateRequest(process.env.SPARETEXT_AUTOMATION_SECRET, req.headers["x-twilio-signature"] ?? "", url, params)) {
    res.writeHead(403).end("Bad signature");
    return;
  }
  console.log(`${params.From} to ${params.To}: ${params.Body}${params.NumMedia !== "0" ? ` (+${params.NumMedia} pictures)` : ""}`);
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(/hours/i.test(params.Body) ? "We're open 9 to 6, Monday to Saturday." : "Thanks, we got your message and will text you back soon.");
  res.writeHead(200, { "content-type": "text/xml" }).end(twiml.toString());
}).listen(port, () => console.log(`Twilio-style handler listening at ${publicUrl}`));
