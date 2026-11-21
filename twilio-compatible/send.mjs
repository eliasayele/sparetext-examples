// Send a text through Sparetext with Twilio's own Node.js client: the code you'd write for Twilio,
// plus one line that points the client at Sparetext. Then fetch it the Twilio way until the phone
// has sent it. Node 18 or newer.
//
//   npm install                              # twilio, pinned in package.json
//   export TWILIO_ACCOUNT_SID=AC...          # yours, or any value starting with AC: it isn't checked
//   export SPARETEXT_API_KEY=spt_live_...    # https://sparetext.dev/keys, in place of the Auth Token
//   node send.mjs +12025550123 "Your order is ready for pickup."
//
// Set STATUS_CALLBACK to a URL (status-callback.mjs is one) to hear each change as Twilio posts it.
import twilio from "twilio";

const [to, body] = process.argv.slice(2);
if (!to || !body) {
  console.error('Usage: node send.mjs +12025550123 "Your text"');
  process.exit(1);
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID ?? "ACsparetext", process.env.SPARETEXT_API_KEY);
client.api.baseUrl = process.env.SPARETEXT_SERVER ?? "https://sparetext.dev"; // the one new line

try {
  let message = await client.messages.create({
    to,
    body,
    ...(process.env.STATUS_CALLBACK ? { statusCallback: process.env.STATUS_CALLBACK } : {}),
  });
  console.log(`${message.sid} to ${message.to}: ${message.status}`);
  // Twilio's fetch works too: follow the text until the phone has sent it (or a minute passes).
  for (let i = 0; i < 20 && ["queued", "scheduled", "sending"].includes(message.status); i++) {
    await new Promise((r) => setTimeout(r, 3000));
    message = await client.messages(message.sid).fetch();
    console.log(`${message.sid}: ${message.status}${message.errorCode ? ` (${message.errorCode}: ${message.errorMessage})` : ""}`);
  }
} catch (e) {
  // A refusal is Twilio's RestException, with Twilio's code: 21211 for a bad number, 21610 for one that opted out.
  console.error(`${e.status} ${e.code}: ${e.message}`);
  process.exit(1);
}
