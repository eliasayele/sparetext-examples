// Text someone from your own phone and wait for the reply. Node 18 or newer, no packages.
//
//   export SPARETEXT_API_KEY=spt_live_...
//   node wait-for-reply.mjs +12025550123 "Can you make 7pm tomorrow? Reply YES or NO."
//
// For many conversations at once, use a webhook (webhook-receiver.mjs) instead of polling.

const server = (process.env.SPARETEXT_SERVER ?? "https://sparetext.dev").replace(/\/$/, "");
const headers = { "x-api-key": process.env.SPARETEXT_API_KEY, "content-type": "application/json" };
const [to, text] = process.argv.slice(2);
if (!to || !text) {
  console.error('Usage: node wait-for-reply.mjs +12025550123 "Your question"');
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(`${server}/api/v1${path}`, { ...init, headers });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${body.error.code}: ${body.error.message}`);
  return body;
}

const {
  messages: [sent],
} = await api("/messages", { method: "POST", body: JSON.stringify({ to, text }) });
console.log(`Queued ${sent.id}`);

let status = sent.status;
const deadline = Date.now() + 10 * 60_000;
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 3000));
  const { message } = await api(`/messages/${sent.id}`);
  if (message.status !== status) console.log(`Status: ${(status = message.status)}`);
  if (status === "failed") throw new Error(`The text failed: ${message.error}`);

  const q = new URLSearchParams({ direction: "inbound", contact: to, since: sent.createdAt });
  const { messages: replies } = await api(`/messages?${q}`);
  if (replies.length) {
    const reply = replies.at(-1); // newest first, so the last one is their first reply
    console.log(`Reply from ${reply.contact}: ${reply.text}`);
    process.exit(0);
  }
}
console.log("No reply within 10 minutes.");
process.exit(1);
