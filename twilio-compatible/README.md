# Twilio-compatible: keep your Twilio code, send from your own phone

Sparetext answers Twilio's Messages API at Twilio's own paths. Code written for Twilio's REST API sends through your own Android phone or iPhone after two changes:

1. The host: `https://api.twilio.com` becomes `https://sparetext.dev`.
2. The password: your Sparetext API key ([make one](https://sparetext.dev/keys)) in place of the Auth Token. The username can stay your AccountSid. Sparetext doesn't check it, so with no Twilio account any value starting with `AC` works.

```bash
export TWILIO_ACCOUNT_SID=AC...          # yours, or any value starting with AC
export SPARETEXT_API_KEY=spt_live_...    # https://sparetext.dev/keys
```

## curl

Twilio's own send call, with only the host and the password changed:

```bash
curl -X POST "https://sparetext.dev/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -u "$TWILIO_ACCOUNT_SID:$SPARETEXT_API_KEY" \
  --data-urlencode "To=+12025550123" \
  --data-urlencode "Body=Your order is ready for pickup."
```

```json
{
  "sid": "SM2026112175347a33337a7370cf2d2003",
  "account_sid": "AC...",
  "status": "queued",
  "to": "+12025550123",
  "from": "+12025550100",
  "body": "Your order is ready for pickup.",
  "num_segments": "1",
  "direction": "outbound-api",
  "error_code": null,
  "date_created": "Sat, 21 Nov 2026 11:31:23 +0000",
  "uri": "/2010-04-01/Accounts/AC.../Messages/SM2026112175347a33337a7370cf2d2003.json",
  ...
}
```

Fetch it again with `GET .../Messages/{Sid}.json`. [`send.sh`](send.sh) is the same call as a script.

## Twilio's Node.js and Python clients

Both official clients take a different host with one line, and everything else stays Twilio code:

```js
import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.SPARETEXT_API_KEY);
client.api.baseUrl = "https://sparetext.dev"; // the one new line

const message = await client.messages.create({ to: "+12025550123", body: "Your order is ready for pickup." });
console.log(message.sid, message.status);
```

```python
import os
from twilio.rest import Client

client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["SPARETEXT_API_KEY"])
client.api.base_url = "https://sparetext.dev"  # the one new line

message = client.messages.create(to="+12025550123", body="Your order is ready for pickup.")
print(message.sid, message.status)
```

| File | What it does |
|---|---|
| [`send.sh`](send.sh) | Twilio's curl call: `./send.sh +12025550123 "Your order is ready for pickup."` |
| [`send.mjs`](send.mjs) | twilio-node: send, then fetch until the phone has sent it. `npm install`, then `node send.mjs +12025550123 "Hi"` |
| [`send.py`](send.py) | twilio-python, the same. `pip install -r requirements.txt`, then `python3 send.py +12025550123 "Hi"` |
| [`status-callback.mjs`](status-callback.mjs) | A StatusCallback receiver that checks `X-Twilio-Signature` with `twilio.validateRequest` |

Tried with twilio 5.13.1 (Node) and twilio 9.13.0 (Python), pinned in `package.json` and `requirements.txt`.

## What maps to what

- **`From`**: one of your numbers (a SIM's, a Twilio line's or a business number's) or a phone id picks that phone and SIM. Any other `From`, like your old Twilio number, isn't refused: the text goes from your default phone, and `from` in the answer is that phone's number (`null` when the phone doesn't know its own number).
- **`Body`** up to 1,600 characters, **`MediaUrl`** up to 3 pictures (an MMS), **`SendAt`** with `ScheduleType=fixed` up to 30 days ahead, **`ValidityPeriod`** in seconds.
- **`StatusCallback`** hears `sent`, `delivered`, `failed` or `undelivered`, and `canceled`, form-encoded with Twilio's fields (`MessageSid`, `MessageStatus`, `ErrorCode`, ...). `X-Twilio-Signature` is signed with your callback secret (Webhooks page, or `POST /api/v1/webhooks/callback-secret`), so Twilio's own `validateRequest` checks it with that secret in place of the Auth Token.
- **Statuses**: `queued`, `scheduled`, `sending` (a phone has it), `sent`, `delivered`, `undelivered` (the carrier's report said no), `failed`, `canceled`.
- **Errors** come back as Twilio's `{code, message, more_info, status}` with Twilio's codes: 21211 a bad `To`, 21602 no `Body`, 21610 a number that replied STOP, 20003 a bad key, 20429 too fast, 20005 the month's texts are used up.
- **Ignored**: `MessagingServiceSid`, `ApplicationSid`, `MaxPrice`, `ShortenUrls` and Twilio's other options. `ContentSid` templates are refused: send the words in `Body`.
- **Limits** are Sparetext's: Free is 1 phone and 300 texts a month, and opt-outs, each key's caps and the send rate hold as on `POST /api/v1/messages`.

Only sending and fetching texts are covered. For replies, conversations and phones, use the [Sparetext API](https://sparetext.dev/docs) or its webhooks. The full reference: [sparetext.dev/docs#twilio](https://sparetext.dev/docs#twilio).
