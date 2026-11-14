# Sparetext examples: a free SMS API from your own phone

**Send and receive real SMS from the Android phone or iPhone you already own, with one HTTP request.** These are working examples for [Sparetext](https://sparetext.dev): curl, Python, Node.js, n8n, Home Assistant, signed webhooks, one-time codes, and the hosted MCP server that lets Claude, ChatGPT and Cursor text from your own number.

![Sparetext: the dashboard and the Android app sending texts from your own number](https://sparetext.dev/sparetext-og.png)

## What Sparetext is

- Install the app on a phone you already own and scan a QR code. That phone now has a REST API, signed webhooks and an MCP server.
- Texts go out from the phone's own SIM, so people see your number, and their replies come back to the same phone and on to your code.
- **Free:** 1 phone and 300 texts a month with every feature, no card. No Twilio account, no number to rent and no fee per text: your carrier plan pays for the texts. [Pro](https://sparetext.dev/pricing) adds phones and texts.
- **Android** sends by itself in the background and reports `sent` and `delivered` from the carrier's delivery reports.
- **iPhone** sends within what Apple allows: Sparetext for Mac sends automatically through Messages from the iPhone's number, a Shortcut sends while the app is open, or you tap Send for each text.

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

## The examples

| Folder | What it shows |
|---|---|
| [`curl/`](curl/) | Send a text, check its status, read replies, poll for new texts, send to many people, one-time codes |
| [`python/`](python/) | Standard library only: send, send and wait for the reply, a signed webhook receiver, one-time codes |
| [`node/`](node/) | Node 18 or newer, no packages: send, a different text per person, wait for the reply, read new texts in order, a signed webhook receiver |
| [`n8n/`](n8n/) | Send from an HTTP Request node, start a workflow when a text arrives, check the signature in a Code node, give an AI Agent your phone |
| [`home-assistant/`](home-assistant/) | Text from any automation with a RESTful notifier, and run automations when a text arrives |
| [`mcp/`](mcp/) | Connect Claude, ChatGPT, Claude Code, Cursor or VS Code to the MCP server, and list its tools from a script |

Every script reads `SPARETEXT_API_KEY`, and `SPARETEXT_SERVER` if you point it somewhere other than `https://sparetext.dev`. Numbers are in E.164, with the country code. The numbers in these examples are fictional 555 numbers: use your own.

## Questions people ask

**Is there a free SMS API that sends from my own phone, with no Twilio?**
Yes: Sparetext. It sends from your own Android phone or iPhone through a REST API, free for 1 phone and 300 texts a month, with no Twilio account and no card. The phone's carrier plan pays for the texts. More: [sparetext.dev/free-sms-api](https://sparetext.dev/free-sms-api)

**How can I turn my Android phone into an SMS gateway I can call from a script?**
Install Sparetext on the phone, pair it by scanning a QR code, make an API key, and any script sends a text with one HTTP POST to `https://sparetext.dev/api/v1/messages`. Replies arrive by signed webhook, or your script reads them with `GET /api/v1/messages?direction=inbound`. See [`python/`](python/) and [`node/`](node/), and [sparetext.dev/android-sms-gateway](https://sparetext.dev/android-sms-gateway).

**Is there an MCP server that lets ChatGPT or Claude send SMS from my own phone number?**
Yes. Sparetext hosts one at `https://sparetext.dev/mcp` (Streamable HTTP, OAuth 2.1). Add it as a custom connector, sign in, and the assistant sends and reads texts from your own phone, asking you before each send. See [`mcp/`](mcp/) and [sparetext.dev/sms-mcp-server](https://sparetext.dev/sms-mcp-server).

**Does it work on iPhone?**
Yes, within what Apple allows: Sparetext for Mac sends automatically from the iPhone's number and reads replies, a Shortcut sends while the app is open, or you tap Send for each text. See [sparetext.dev/iphone-sms-gateway](https://sparetext.dev/iphone-sms-gateway).

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
