# Sparetext REST API, for agents without MCP

Use this when Sparetext's MCP tools aren't connected but `SPARETEXT_API_KEY` is
set. Every call needs the key; never print it.

```bash
TA="${SPARETEXT_SERVER:-https://sparetext.dev}/api/v1"
AUTH="Authorization: Bearer $SPARETEXT_API_KEY"
```

Never build message text into a shell string. Pass it through `jq --arg`, so
quotes, `$` and backticks in a message can't run anything.

## Send

```bash
jq -n --arg to "+15551234567" --arg text "Hi Sam, your table for 4 is ready." \
  '{to: $to, text: $text}' |
  curl -sS -X POST "$TA/messages" -H "$AUTH" -H 'content-type: application/json' --data-binary @-
```

Answer `202 {"batchId", "messages": [{"id", "status", ...}]}`. Fields:

- `to`: a number or a list of up to 100, in E.164 form.
- `text`: up to 1,600 characters.
- Optional: `deviceId` (which phone), `scheduledAt` (ISO 8601, up to 30 days
  ahead), `ttl` (seconds after which an unsent text is dropped, such as `300`
  for a one-time code).
- Optional header `Idempotency-Key: <your own id>`, so a retry never sends
  twice.

A different text for each person, in one batch:

```bash
jq -n '{messages: [{to: "+15551234567", text: "Hi Sam, table 4 at 7 pm."},
                   {to: "+15557654321", text: "Hi Lee, table 9 at 8 pm."}]}' |
  curl -sS -X POST "$TA/messages" -H "$AUTH" -H 'content-type: application/json' --data-binary @-
curl -sS "$TA/batches/<batchId>" -H "$AUTH"     # counts of each status
```

## Check a text

```bash
curl -sS "$TA/messages/msg_20261027_k3j9x2ab" -H "$AUTH"
```

Answer `{"message": {"id", "status", "error", ...}}`. The statuses are in
SKILL.md.

## Read texts and wait for a reply

```bash
curl -sS -G "$TA/messages" -H "$AUTH" -d direction=inbound \
  --data-urlencode "contact=+15551234567" --data-urlencode "since=2026-10-27T12:00:00.000Z"
```

Answer `{"messages": [...], "nextCursor"}`, newest first. Filters: `direction`
(`inbound` or `outbound`), `status`, `deviceId`, `contact`, `q` (search),
`limit` (up to 100), `before` (the previous page's `nextCursor`), `since` (ISO
time).

To wait for a reply, note the `createdAt` of the text you sent, then ask with
`since` set to it every 5 seconds until a reply comes or the user's time limit
passes.

## Phones

```bash
curl -sS "$TA/devices" -H "$AUTH"
```

Answer `{"devices": [...]}` with `name`, `platform`, `mode`, `online`,
`enabled`, `isDefault` and `queued`. Check one is online before promising a
quick delivery.

## Cancel

```bash
curl -sS -X DELETE "$TA/messages/msg_20261027_k3j9x2ab" -H "$AUTH"
```

Answers `204`, or `409` once the phone has taken the text.

## One-time codes

Sparetext can make and check the code for you:

```bash
curl -sS -X POST "$TA/verify" -H "$AUTH" -H 'content-type: application/json' -d '{"to": "+15551234567"}'
curl -sS -X POST "$TA/verify/<id>/check" -H "$AUTH" -H 'content-type: application/json' -d '{"code": "123456"}'
```

The check answers `{"valid": true|false, "verification"}`. A wrong code stays
`pending` and can be tried again; an expired one comes back with `status:
"expired"`; after five wrong tries the check answers `429 too_many_tries`.

## Full reference

https://sparetext.dev/docs (every endpoint, webhooks and their signature check)
and https://sparetext.dev/openapi.json.
