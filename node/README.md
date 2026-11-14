# Sparetext with Node.js

Send and receive SMS from your own phone in Node 18 or newer, with the built-in `fetch`: nothing to install.

```bash
export SPARETEXT_API_KEY=spt_live_...   # https://sparetext.dev/keys
```

| Script | What it does |
|---|---|
| [`send.mjs`](send.mjs) | Send one text: `node send.mjs +12025550123 "Your order is ready for pickup."` |
| [`send-batch.mjs`](send-batch.mjs) | A different text for each person in one request, with an `Idempotency-Key`, then count the statuses |
| [`wait-for-reply.mjs`](wait-for-reply.mjs) | Send a question, follow it to `delivered`, and print the reply when it comes |
| [`read-new-texts.mjs`](read-new-texts.mjs) | Read the texts received since the last run, oldest first, for a cron job with no public URL |
| [`webhook-receiver.mjs`](webhook-receiver.mjs) | A server that takes the texts your phone receives as signed webhooks and checks each signature |

The send itself:

```js
const res = await fetch("https://sparetext.dev/api/v1/messages", {
  method: "POST",
  headers: { "x-api-key": process.env.SPARETEXT_API_KEY, "content-type": "application/json" },
  body: JSON.stringify({ to: "+12025550123", text: "Your order is ready for pickup." }),
});
console.log(await res.json());
```

## Checking a webhook's signature in Express

`fromSparetext()` in [`webhook-receiver.mjs`](webhook-receiver.mjs) needs the body exactly as it arrived, so give that route `express.raw({ type: "application/json" })` instead of `express.json()`, check `req.body` (a Buffer) with the `x-sparetext-signature` header, then `JSON.parse` it.

More in the [API reference](https://sparetext.dev/docs) and [Send SMS from Node.js](https://sparetext.dev/blog/send-sms-from-node-js).
