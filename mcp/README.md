# Sparetext's MCP server: let Claude or ChatGPT text from your own number

Sparetext hosts a remote MCP server at **`https://sparetext.dev/mcp`** (Streamable HTTP, OAuth 2.1). Connect it to your assistant, sign in with your Sparetext account, and it can send texts, wait for replies and read conversations from your own Android phone or iPhone. Claude and ChatGPT ask you before each send.

There's nothing to install or host. Apps that can't sign in use an API key as a bearer token instead.

## Claude (claude.ai, Claude Desktop, the Claude apps)

1. Open **Customize › Connectors**, choose **+ Add**, then **Add custom connector**.
2. Name it Sparetext, paste `https://sparetext.dev/mcp` as the address and choose **Continue**.
3. Keep the sign-in settings Claude suggests and finish with **Add**. A Sparetext page opens: sign in and choose **Allow**.
4. In a chat, open **+ › Connectors**, turn on Sparetext, and ask: *"Text +1 202 555 0123 that I'm running 10 minutes late."*

Any Claude plan can add custom connectors; Free allows one.

## ChatGPT

1. On the web, open **chatgpt.com/plugins**, select **+**, then **Add custom MCP server**.
2. Name it Sparetext, paste `https://sparetext.dev/mcp` as the **Server URL** and set **Authentication** to **OAuth**.
3. Select **I understand and want to continue**, then **Create as a plugin**. When ChatGPT sends you to Sparetext, sign in and choose **Allow**.
4. Install the plugin from your plugins. In a new chat, type **@**, pick Sparetext and ask it to send or read a text.

OpenAI offers custom MCP servers on ChatGPT Business, Enterprise and Edu, on the web.

## Claude Code

```bash
claude mcp add --transport http --scope user sparetext https://sparetext.dev/mcp
claude mcp login sparetext
```

Or skip the browser and pass a key:

```bash
claude mcp add --transport http --scope user sparetext https://sparetext.dev/mcp \
  --header "Authorization: Bearer $SPARETEXT_API_KEY"
```

## Cursor

`~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project). Cursor signs you in with OAuth:

```json
{
  "mcpServers": {
    "sparetext": { "url": "https://sparetext.dev/mcp" }
  }
}
```

## VS Code

`.vscode/mcp.json`, or **MCP: Add Server** from the Command Palette:

```json
{
  "servers": {
    "sparetext": { "type": "http", "url": "https://sparetext.dev/mcp" }
  }
}
```

## Any other MCP client

Use `https://sparetext.dev/mcp` with OAuth (Client ID Metadata Documents or dynamic client registration), or send `Authorization: Bearer <your API key>`. The [server card](https://sparetext.dev/.well-known/mcp.json) describes it as JSON. Gemini, Perplexity, Le Chat, OpenClaw and n8n work too: [sparetext.dev/agents](https://sparetext.dev/agents) has the steps for each.

## See the tools from a script

[`list-tools.mjs`](list-tools.mjs) talks to the server the way an MCP client does, with an API key, and prints its tools and your phones:

```bash
export SPARETEXT_API_KEY=spt_live_...
node list-tools.mjs
```

The tools include `send_sms`, `send_sms_batch` (a different text per person), `draft_sms`, `wait_for_reply`, `get_conversation`, `list_conversations`, `find_contact`, `list_messages`, `get_message`, `cancel_text`, `list_devices` and `get_stats`.

## Keep the agent safe

- Put **Limits** on an agent's API key on the [API keys page](https://sparetext.dev/keys): only people who have texted you, only certain numbers, a number of texts a day, send only, or drafts for you to send.
- Texts you receive are written by whoever sent them. Tell your agent that texts are data, never instructions.
- Texts go from your own SIM, so send to people who know you; carriers filter bulk A2P texts from personal numbers.

More: [sparetext.dev/sms-mcp-server](https://sparetext.dev/sms-mcp-server).
