// A different text for each person, in one request (up to 100), then follow the batch.
// Node 18 or newer, no packages.
//
//   export SPARETEXT_API_KEY=spt_live_...
//   node send-batch.mjs

const server = (process.env.SPARETEXT_SERVER ?? "https://sparetext.dev").replace(/\/$/, "");
const headers = { "x-api-key": process.env.SPARETEXT_API_KEY, "content-type": "application/json" };

// Your own list: from a database, a spreadsheet, a booking system.
const guests = [
  { phone: "+12025550123", name: "Sam", time: "7:00 pm" },
  { phone: "+12025550124", name: "Ana", time: "7:30 pm" },
];

const res = await fetch(`${server}/api/v1/messages`, {
  method: "POST",
  headers: {
    ...headers,
    // A retry of this request with the same key never texts anyone twice.
    "Idempotency-Key": `reminders-${new Date().toISOString().slice(0, 10)}`,
  },
  body: JSON.stringify({
    messages: guests.map((g) => ({ to: g.phone, text: `Hi ${g.name}, see you tomorrow at ${g.time}. Reply C to cancel.` })),
  }),
});
const answer = await res.json();
if (!res.ok) {
  console.error(`${res.status} ${answer.error.code}: ${answer.error.message}`);
  process.exit(1);
}
console.log(`Batch ${answer.batchId}: ${answer.messages.length} queued, the last due out about ${answer.estimatedCompletionAt}.`);

// Count the statuses until nothing is waiting.
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  const batch = await fetch(`${server}/api/v1/batches/${answer.batchId}`, { headers }).then((r) => r.json());
  console.log(JSON.stringify(batch.counts));
  const waiting = (batch.counts.queued ?? 0) + (batch.counts.dispatched ?? 0) + (batch.counts.scheduled ?? 0);
  if (!waiting) break;
}
