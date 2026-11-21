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
| [`incoming.mjs`](incoming.mjs) | An "A message comes in" handler: checks the signature and answers TwiML with `MessagingResponse` |
| [`setup-incoming.sh`](setup-incoming.sh) | Points the texts your phone receives at that handler: `./setup-incoming.sh https://your-server.example/sms` |

Tried with twilio 5.13.1 (Node) and twilio 9.13.0 (Python), pinned in `package.json` and `requirements.txt`.

## List, update and delete

```js
const texts = await client.messages.list({ to: "+12025550123", limit: 100 }); // follows next_page_uri
client.messages.each({ dateSentAfter: new Date("2026-11-01") }, (m) => console.log(m.sid, m.status, m.body));
await client.messages(sid).update({ status: "canceled" }); // a text still waiting to go out
await client.messages(sid).update({ body: "" });           // remove a sent text's words
await client.messages(sid).remove();                       // delete it
```

List takes `To`, `From`, `DateSent`, `DateSent<`, `DateSent>` and `PageSize`, newest first, and the clients follow `next_page_uri` themselves. Removing words and deleting need a key without limits (clear the key's limits on the API keys page), as on Sparetext's own API.

## Incoming texts, to a handler written for Twilio

On Twilio, a number's "A message comes in" URL gets each text. On Sparetext, an automation does it: **Automations, Call a URL, Twilio handler** in the dashboard, or [`setup-incoming.sh`](setup-incoming.sh). Each text your phone receives is posted as Twilio's form fields (`From`, `To`, `Body`, `MessageSid`, `NumMedia`, `MediaUrl0`, ...), signed in `X-Twilio-Signature` with the automation's secret. Answer TwiML and the `<Message>` goes back to the sender from the same phone:

```js
const twiml = new twilio.twiml.MessagingResponse();
twiml.message("Thanks, we got your message.");
res.type("text/xml").send(twiml.toString());
```

Up to 3 `<Message>`s, each with up to 3 `<Media>` pictures. A `<Message>`'s `to` and `from` are ignored: the reply always goes to the person who texted, so a handler can't text anyone else. One reply a minute to the same number. `MediaUrl0` needs your key, as the HTTP Basic password like everything else here.

## What maps to what

- **`From`**: one of your numbers (a SIM's, a Twilio line's or a business number's) or a phone id picks that phone and SIM. Any other `From`, like your old Twilio number, isn't refused: the text goes from your default phone, and `from` in the answer is that phone's number (`null` when the phone doesn't know its own number).
- **`Body`** up to 1,600 characters, **`MediaUrl`** up to 3 pictures (an MMS), **`SendAt`** with `ScheduleType=fixed` up to 30 days ahead, **`ValidityPeriod`** in seconds.
- **`StatusCallback`** hears `sent`, `delivered`, `failed` or `undelivered`, and `canceled`, form-encoded with Twilio's fields (`MessageSid`, `MessageStatus`, `ErrorCode`, ...). `X-Twilio-Signature` is signed with your callback secret (Webhooks page, or `POST /api/v1/webhooks/callback-secret`), so Twilio's own `validateRequest` checks it with that secret in place of the Auth Token.
- **Statuses**: `queued`, `scheduled`, `sending` (a phone has it), `sent`, `delivered`, `undelivered` (the carrier's report said no), `failed`, `canceled`.
- **Errors** come back as Twilio's `{code, message, more_info, status}` with Twilio's codes: 21211 a bad `To`, 21602 no `Body`, 21610 a number that replied STOP, 20003 a bad key, 20429 too fast, 20005 the month's texts are used up, 20009 deleting a text still on its way.
- **Ignored**: `MessagingServiceSid`, `ApplicationSid`, `MaxPrice`, `ShortenUrls` and Twilio's other options. `ContentSid` templates are refused: send the words in `Body`.
- **Limits** are Sparetext's: Free is 1 phone and 300 texts a month, and opt-outs, each key's caps and the send rate hold as on `POST /api/v1/messages`.

Twilio's Messages API is covered: send, list, fetch, update, delete, status callbacks and incoming texts. For conversations, phones, contacts and everything else, use the [Sparetext API](https://sparetext.dev/docs). The full reference: [sparetext.dev/docs#twilio](https://sparetext.dev/docs#twilio).
