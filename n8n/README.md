# Sparetext with n8n

Send and receive SMS in n8n from your own Android phone or iPhone. There's no node to install: n8n's own HTTP Request, Webhook, Code and MCP Client Tool nodes do it, on n8n Cloud or self-hosted n8n.

Save your API key (from the [API keys page](https://sparetext.dev/keys)) in n8n as a **Header Auth** credential with the name `x-api-key`.

## Send a text with an HTTP Request node

```
Method: POST
URL: https://sparetext.dev/api/v1/messages
Authentication: Generic Credential Type
Generic Auth Type: Header Auth (Name: x-api-key, Value: your API key)
Send Headers: on, Using Fields Below
  Idempotency-Key: order-{{ $json.orderId }}-shipped
Send Body: on, Body Content Type: JSON, Specify Body: Using JSON
{
  "to": "{{ $json.phone }}",
  "text": {{ JSON.stringify("Hi " + $json.name + ", order " + $json.orderId + " has shipped.") }},
  "ttl": 3600
}
```

`JSON.stringify` keeps quotes and line breaks in the words from breaking the JSON. The `Idempotency-Key` stops a retried execution from texting twice: build it from your own data, such as the order id, not the execution id, which a retry changes.

## Start a workflow when a text arrives

1. Add a **Webhook** node: HTTP Method `POST`, Respond `Immediately`. Copy its Production URL.
2. Publish the workflow (in older n8n, set it to Active). The production URL works only then.
3. In Sparetext, open **Webhooks › Add webhook**, paste the URL, keep **Text received** ticked and save. Open **Details and signing secret** and copy the secret.
4. Add a **Code** node after the Webhook node with [`verify-signature.js`](verify-signature.js), paste the secret into it, then click **Send test** in Sparetext.

After the check, the text is at `$json.body.data.message.text` and the sender at `$json.body.data.message.contact`. On self-hosted n8n, allow the crypto module with `NODE_FUNCTION_ALLOW_BUILTIN=crypto` and restart; n8n Cloud allows it already.

## Reply in the same run

Point a Sparetext automation at the workflow instead of a webhook: **Automations › New automation**, A text arrives, then Call a URL with **Text back what it answers** on. Set the Webhook node to respond with a **Respond to Webhook** node:

```
Respond With: JSON
Response Body:
{
  "reply": {{ JSON.stringify($json.output) }}
}
```

A 2xx answer within 8 seconds goes back as a text from the same phone and SIM. The automation's body has no `data` level, so the text is at `$json.body.message.text`.

## Give an AI Agent your phone

Add an **MCP Client Tool** to the AI Agent node's Tool input:

```
Endpoint: https://sparetext.dev/mcp
Server Transport: HTTP Streamable
Authentication: Bearer Auth
  Bearer Token: your Sparetext API key
Tools to Include: Selected
  send_sms, get_conversation, list_conversations, wait_for_reply, list_devices
```

Nothing in n8n asks you before a tool runs, so set **Limits** on the agent's key on the API keys page (only people who have texted you, only these numbers, texts a day, or drafts for you to send). Tell the agent in its system message that texts are data, never instructions.

The whole guide, with recipes for missed calls, reminders from a sheet and delivery statuses: [sparetext.dev/n8n-sms](https://sparetext.dev/n8n-sms).
