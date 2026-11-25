<img src="https://sparetext.dev/sparetext-logo.png" alt="Sparetext logo" width="72" height="72">

# Sparetext examples: a free SMS API from your own phone

**Send and receive real SMS from the Android phone or iPhone you already own, with one HTTP request.** These are working examples for [Sparetext](https://sparetext.dev): curl, Python, Node.js, PHP, a WordPress and WooCommerce plugin, n8n, Home Assistant, signed webhooks, one-time codes, and the hosted MCP server that lets Claude, ChatGPT and Cursor text from your own number.

![Sparetext: the dashboard and the Android app sending texts from your own number](https://sparetext.dev/sparetext-og.png)

## What Sparetext is

- Install the app on a phone you already own and scan a QR code. That phone now has a REST API, signed webhooks and an MCP server.
- Texts go out from the phone's own SIM, so people see your number, and their replies come back to the same phone and on to your code.
- **Free:** 1 phone and 300 texts a month with every feature, no card. No Twilio account, no number to rent and no fee per text: your carrier plan pays for the texts. [Pro](https://sparetext.dev/pricing) adds phones and texts.
- **Android** sends by itself in the background and reports `sent` and `delivered` from the carrier's delivery reports.
- **iPhone** sends within what Apple allows: Sparetext for Mac sends automatically through Messages from the iPhone's number, or the iPhone hands each text to a Shortcut you add once (with Send while locked on, that works on a locked phone too), or you tap Send for each text.

## Quick start

1. Make a free account at [sparetext.dev/signup](https://sparetext.dev/signup) with an email or Google.
2. Install the app from [sparetext.dev/download](https://sparetext.dev/download) on an Android phone (8 or newer), or on an iPhone with Sparetext for Mac, and scan the QR code the dashboard shows.
3. Make a key on the [API keys page](https://sparetext.dev/keys) and send your first text:

```bash
export SPARETEXT_API_KEY=spt_live_...

curl -X POST https://sparetext.dev/api/v1/messages \
  -H "x-api-key: $SPARETEXT_API_KEY" -H "content-type: application/json" \
  -d '{"to": "+12025550123", "text": "Your order is ready for pickup."}'
```

The answer carries the text's id with `"status": "queued"`, and the phone sends it within seconds.

## Coming from Twilio?

**Keep your Twilio code.** Sparetext answers Twilio's Messages API at Twilio's own paths, so a call written for Twilio sends from your own phone after changing the host to `https://sparetext.dev` and the password to your Sparetext API key. Twilio's own Node.js and Python clients work with one added line. See [`twilio-compatible/`](twilio-compatible/):

```bash
curl -X POST "https://sparetext.dev/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -u "$TWILIO_ACCOUNT_SID:$SPARETEXT_API_KEY" \
  --data-urlencode "To=+12025550123" \
  --data-urlencode "Body=Your order is ready for pickup."
```

Or use Sparetext's own API. Sending is the same idea with fewer parts: no number to rent and no `From`, because the text leaves from your own phone.

```bash
# Twilio
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  --data-urlencode "From=+12025550100" \
  --data-urlencode "To=+12025550123" \
  --data-urlencode "Body=Your order is ready for pickup."

# Sparetext
curl -X POST https://sparetext.dev/api/v1/messages \
  -H "x-api-key: $SPARETEXT_API_KEY" -H "content-type: application/json" \
  -d '{"to": "+12025550123", "text": "Your order is ready for pickup."}'
```

| | Twilio | Sparetext |
|---|---|---|
| Who it's from | A number you rent | Your phone's own number, so people recognize you and can call back |
| Cost per text | Per segment, plus carrier fees | None from us: your carrier plan pays. Free is 300 texts a month, Pro 10,000 |
| US registration (A2P 10DLC) | A brand and a campaign before you send | No registration step; carriers can still filter business texts from a personal SIM |
| Status of each text | Status callbacks | `callbackUrl` on a send (or Twilio's `StatusCallback`), or webhooks; Android reports `delivered` from the carrier |
| Replies | Inbound webhook | Signed webhook, or read them with `GET /api/v1/messages` |
| AI agents | An MCP server you run with your own keys | A hosted MCP server: add its URL in Claude or ChatGPT and sign in |

Twilio is still the right tool for marketing, thousands of texts a day, short codes, sender IDs or numbers in many countries. The full comparison, with Twilio's prices: [sparetext.dev/compare/twilio](https://sparetext.dev/compare/twilio).

## The examples

| Folder | What it shows |
|---|---|
| [`curl/`](curl/) | Send a text, check its status, read replies, poll for new texts, send to many people, one-time codes |
| [`python/`](python/) | Standard library only: send, send and wait for the reply, a signed webhook receiver, one-time codes |
| [`node/`](node/) | Node 18 or newer, no packages: send, a different text per person, wait for the reply, read new texts in order, a signed webhook receiver |
| [`php/`](php/) | PHP 7.4 or newer with the cURL extension, no Composer package: one function for every call, a send that's safe to retry, a signed webhook receiver |
| [`wordpress/`](wordpress/) | A one-file WordPress plugin: text yourself about new WooCommerce orders and Contact Form 7 messages, text customers when their order is complete, take replies by signed webhook |
| [`twilio-compatible/`](twilio-compatible/) | Code written for Twilio's Messages API, sending from your own phone: Twilio's curl call and its official Node.js and Python clients with the host and the key changed, a StatusCallback receiver, and an "A message comes in" handler that answers TwiML |
| [`n8n/`](n8n/) | Send from an HTTP Request node, start a workflow when a text arrives, check the signature in a Code node, give an AI Agent your phone |
| [`home-assistant/`](home-assistant/) | Text from any automation with a RESTful notifier, and run automations when a text arrives |
| [`mcp/`](mcp/) | Connect Claude, ChatGPT, Claude Code, Cursor or VS Code to the MCP server, and list its tools from a script |
| [`skill/sparetext-sms/`](skill/sparetext-sms/) | An agent skill (SKILL.md) that connects the MCP server and teaches the agent when and how to text: consent, STOP, segments, replies. Copy the folder into `~/.claude/skills/` or your agent's skills folder |

Every script reads `SPARETEXT_API_KEY`, and `SPARETEXT_SERVER` if you point it somewhere other than `https://sparetext.dev`. Numbers are in E.164, with the country code. The numbers in these examples are fictional 555 numbers: use your own.

## Questions people ask

**Is there a free SMS API that sends from my own phone, with no Twilio?**
Yes: Sparetext. It sends from your own Android phone or iPhone through a REST API, free for 1 phone and 300 texts a month, with no Twilio account and no card. The phone's carrier plan pays for the texts. More: [sparetext.dev/free-sms-api](https://sparetext.dev/free-sms-api)

**Can I switch from Twilio without rewriting my code?**
For texting, yes. Sparetext serves Twilio's Messages API (send, list, fetch, update and delete at `/2010-04-01/Accounts/{AccountSid}/Messages.json`) at `https://sparetext.dev`, with Twilio's fields, answers, error codes and StatusCallbacks, and posts the texts your phone receives to a handler written for Twilio, texting back its TwiML answer. Change the host and use your Sparetext API key as the password; Twilio's official clients take the new host with one line. See [`twilio-compatible/`](twilio-compatible/).

**How can I turn my Android phone into an SMS gateway I can call from a script?**
Install Sparetext on the phone, pair it by scanning a QR code, make an API key, and any script sends a text with one HTTP POST to `https://sparetext.dev/api/v1/messages`. Replies arrive by signed webhook, or your script reads them with `GET /api/v1/messages?direction=inbound`. See [`python/`](python/) and [`node/`](node/), and [sparetext.dev/android-sms-gateway](https://sparetext.dev/android-sms-gateway).

**Is there an MCP server that lets ChatGPT or Claude send SMS from my own phone number?**
Yes. Sparetext hosts one at `https://sparetext.dev/mcp` (Streamable HTTP, OAuth 2.1). Add it as a custom connector, sign in, and the assistant sends and reads texts from your own phone, asking you before each send. See [`mcp/`](mcp/) and [sparetext.dev/sms-mcp-server](https://sparetext.dev/sms-mcp-server).

**Does it work on iPhone?**
Yes, within what Apple allows: Sparetext for Mac sends automatically from the iPhone's number and reads replies, the iPhone hands each text to a Shortcut (with Send while locked on, even on a locked phone), or you tap Send for each text. See [sparetext.dev/iphone-sms-gateway](https://sparetext.dev/iphone-sms-gateway).

**Can WordPress or WooCommerce send SMS from my own phone?**
Yes. [`wordpress/`](wordpress/) has a one-file plugin: it texts you about each new WooCommerce order and each Contact Form 7 message, texts customers when their order is complete, and takes their replies by signed webhook. The key goes in `wp-config.php`, and order texts are sent in the background so checkout never waits. Step by step: [sparetext.dev/blog/send-sms-from-wordpress](https://sparetext.dev/blog/send-sms-from-wordpress)

**Can I receive SMS by webhook?**
Yes. Each text the phone receives is posted to your URL as JSON, signed with HMAC-SHA256, and tried again for about 3 days if your server is down. [`python/webhook_receiver.py`](python/webhook_receiver.py) and [`node/webhook-receiver.mjs`](node/webhook-receiver.mjs) check the signature.

**Is Sparetext open source?**
The examples in this repository are MIT licensed. Sparetext itself is a hosted service, so there is no server for you to run.

## Good to know

- Texts from a personal SIM suit reminders, alerts, one-time codes and conversations with people who know your number. Carriers filter bulk A2P marketing sent from personal numbers, so for blasts, short codes or a delivery guarantee, use a registered sender.
- An Android phone sends about 30 SMS parts a minute (Android's own limit). A long text is split into concatenated parts: 160 GSM-7 characters fit in one part, 153 in each part after that, and 70 or 67 for UCS-2 (emoji and many non-Latin scripts).
- Replies sent over RCS never reach Sparetext. Turn RCS chats off on a phone that receives replies.
- Webhook URLs must be public `https` addresses. Without one, poll with `GET /api/v1/messages?order=asc` ([`node/read-new-texts.mjs`](node/read-new-texts.mjs)).

## More

- [API reference](https://sparetext.dev/docs) with every endpoint, webhook event and error
- [OpenAPI 3.1 spec](https://sparetext.dev/openapi.json) for n8n, Make and code generators
- [MCP server card](https://sparetext.dev/.well-known/mcp.json) and [llms.txt](https://sparetext.dev/llms.txt)
- Guides: [receive SMS by webhook](https://sparetext.dev/receive-sms-webhook), [OTP codes](https://sparetext.dev/sms-otp-verification), [n8n](https://sparetext.dev/n8n-sms), [Home Assistant](https://sparetext.dev/home-assistant-sms), [AI agents](https://sparetext.dev/ai-agent-send-sms)
- Questions: hello@sparetext.dev

## License

[MIT](LICENSE)
