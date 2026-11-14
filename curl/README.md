# Sparetext with curl

Send and read SMS from your own phone with nothing but curl. Make a key on the [API keys page](https://sparetext.dev/keys) first:

```bash
export SPARETEXT_API_KEY=spt_live_...
```

## Send a text

```bash
curl -X POST https://sparetext.dev/api/v1/messages \
  -H "x-api-key: $SPARETEXT_API_KEY" -H "content-type: application/json" \
  -d '{"to": "+12025550123", "text": "Your order is ready for pickup."}'
```

```json
{
  "batchId": "b_...",
  "messages": [{ "id": "msg_20261114_k3j9x2ab", "contact": "+12025550123", "status": "queued", ... }],
  "estimatedCompletionAt": "2026-11-14T09:14:05.000Z"
}
```

Add `-H "Idempotency-Key: order-1042-ready"` and a retry with the same key within 24 hours gets the first answer back instead of texting twice. Add `"ttl": 300` to drop a text that can't go out within 5 minutes, which suits one-time codes.

## Check its status

```bash
curl https://sparetext.dev/api/v1/messages/msg_20261114_k3j9x2ab \
  -H "x-api-key: $SPARETEXT_API_KEY"
```

The status moves `queued`, `dispatched` (the phone has it), `sent`, `delivered`, or `failed` with the phone's reason in `error`. Only Android phones get delivery reports, so from an iPhone `sent` is final.

## Read the replies

```bash
curl "https://sparetext.dev/api/v1/messages?direction=inbound&contact=%2B12025550123" \
  -H "x-api-key: $SPARETEXT_API_KEY"
```

Newest first, 50 a page; pass the answer's `nextCursor` as `before` for the next page. `since` takes an ISO time.

## Poll for new texts, in order

For a cron job without a public webhook URL: texts oldest first, from where the last run stopped. Keep the `after` from each answer and send it back next time (leave it empty the first time).

```bash
curl "https://sparetext.dev/api/v1/messages?order=asc&direction=inbound&after=$AFTER" \
  -H "x-api-key: $SPARETEXT_API_KEY"
# {"messages": [...], "after": "MjAyNi0xMS0xNFQw...", "hasMore": false}
```

## A different text for each person

Up to 100 texts in one request. They share one `batchId`, and `GET /api/v1/batches/{batchId}` counts their statuses.

```bash
curl -X POST https://sparetext.dev/api/v1/messages \
  -H "x-api-key: $SPARETEXT_API_KEY" -H "content-type: application/json" \
  -d '{"messages": [
    {"to": "+12025550123", "text": "Hi Sam, your table for 4 is ready."},
    {"to": "+12025550124", "text": "Hi Ana, your table for 2 is ready."}
  ]}'
```

## Send a one-time code, then check it

Sparetext writes the code, sends it ahead of other waiting texts, and ends the verification after five wrong tries.

```bash
# 1. Text a code to the number the person gave you
curl -X POST https://sparetext.dev/api/v1/verify \
  -H "x-api-key: $SPARETEXT_API_KEY" -H "content-type: application/json" \
  -d '{"to": "+12025550123"}'
# 201 {"verification": {"id": "vrf_...", "status": "pending", ...}}

# 2. Check the code they typed
curl -X POST https://sparetext.dev/api/v1/verify/vrf_.../check \
  -H "x-api-key: $SPARETEXT_API_KEY" -H "content-type: application/json" \
  -d '{"code": "481920"}'
# 200 {"valid": true, "verification": {"status": "approved", ...}}
```

## Schedule a text, or cancel one that hasn't gone out

Add `"scheduledAt": "2026-11-15T09:00:00Z"` to a send to have it go out then (up to 30 days ahead). A text that is still scheduled or waiting for the phone can be canceled; the answer is `204`.

```bash
curl -X DELETE https://sparetext.dev/api/v1/messages/msg_20261114_k3j9x2ab \
  -H "x-api-key: $SPARETEXT_API_KEY"
```

## Your phones

```bash
curl https://sparetext.dev/api/v1/devices -H "x-api-key: $SPARETEXT_API_KEY"
```

Each phone with its online state, battery and the texts waiting for it.

## Errors

Every error is JSON with a code you can branch on:

```json
{"error": {"code": "no_device", "message": "Connect a phone first: Phones > Add phone."}}
```

The [API reference](https://sparetext.dev/docs#errors) lists them all.
