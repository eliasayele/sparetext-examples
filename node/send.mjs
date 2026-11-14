// Send a text from your own phone through Sparetext. Node 18 or newer, no packages.
//
//   export SPARETEXT_API_KEY=spt_live_...
//   node send.mjs +12025550123 "Your order is ready for pickup."

const server = (process.env.SPARETEXT_SERVER ?? "https://sparetext.dev").replace(/\/$/, "");
const [to, text] = process.argv.slice(2);
if (!to || !text) {
  console.error('Usage: node send.mjs +12025550123 "Your text"');
  process.exit(1);
}

const res = await fetch(`${server}/api/v1/messages`, {
  method: "POST",
  headers: { "x-api-key": process.env.SPARETEXT_API_KEY, "content-type": "application/json" },
  body: JSON.stringify({ to, text }),
});
const answer = await res.json();
if (!res.ok) {
  console.error(`${res.status} ${answer.error.code}: ${answer.error.message}`);
  process.exit(1);
}
const [message] = answer.messages;
console.log(`Queued ${message.id} to ${message.contact}: the phone sends it in a few seconds.`);
