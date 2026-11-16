# Connect Sparetext's MCP server

Sparetext hosts a remote MCP server at **`https://sparetext.dev/mcp`**
(Streamable HTTP). There's nothing to install or run. Agents that can sign in
use OAuth 2.1: a Sparetext page opens, the user signs in and chooses Allow.
Agents that can't sign in send an API key as a Bearer token.

The user needs a Sparetext account with a paired phone first
(https://sparetext.dev/signup, then the app from https://sparetext.dev/download).

## API keys

Only for the agents below that use one. The user makes a key in the dashboard
under **API keys** (https://sparetext.dev/keys). It starts with `spt_live_` and
is shown once. They should set it themselves, never paste it into a chat:

```bash
export SPARETEXT_API_KEY=spt_live_...
```

On the same page they can give the key **Limits**: only people who have texted
them, only listed numbers, a number of texts a day, send only, or drafts only.
For an AI agent, limits are a good idea.

## Claude Code

```bash
claude mcp add --transport http --scope user sparetext https://sparetext.dev/mcp
claude mcp login sparetext
```

The login opens a Sparetext page in the browser: choose Allow. Inside Claude
Code, `/mcp` does the same. Or skip the browser and use a key:

```bash
claude mcp add --transport http --scope user sparetext https://sparetext.dev/mcp \
  --header "Authorization: Bearer $SPARETEXT_API_KEY"
```

## Claude (claude.ai, Claude Desktop, the Claude apps)

1. Open **Customize › Connectors**, choose **+ Add**, then **Add custom
   connector**.
2. Name it Sparetext, paste `https://sparetext.dev/mcp` and choose
   **Continue**.
3. Keep the sign-in settings Claude suggests and finish with **Add**. Sign in to
   Sparetext and choose **Allow**.
4. In a chat, open **+ › Connectors** and turn on Sparetext.

## ChatGPT

1. On the web, open **chatgpt.com/plugins**, select **+**, then **Add custom MCP
   server**.
2. Name it Sparetext, paste `https://sparetext.dev/mcp` as the Server URL and
   set Authentication to **OAuth**.
3. Create it, sign in to Sparetext and choose **Allow**.
4. In a new chat, type **@** and pick Sparetext.

Custom MCP servers depend on the ChatGPT plan: see OpenAI's help pages for
which plans have them.

## Cursor

`~/.cursor/mcp.json`, or `.cursor/mcp.json` in a project. Cursor signs in with
OAuth:

```json
{
  "mcpServers": {
    "sparetext": { "url": "https://sparetext.dev/mcp" }
  }
}
```

## VS Code (GitHub Copilot)

`.vscode/mcp.json`, or **MCP: Add Server** from the Command Palette. VS Code
signs in with OAuth:

```json
{
  "servers": {
    "sparetext": { "type": "http", "url": "https://sparetext.dev/mcp" }
  }
}
```

## Codex CLI

`~/.codex/config.toml`, or `.codex/config.toml` in a trusted project:

```toml
[mcp_servers.sparetext]
url = "https://sparetext.dev/mcp"
```

Then sign in with `codex mcp login sparetext`. To use a key instead, add
`bearer_token_env_var = "SPARETEXT_API_KEY"` under the same table.

## Gemini CLI

`~/.gemini/settings.json`, or `.gemini/settings.json` in a project:

```json
{
  "mcpServers": {
    "sparetext": { "url": "https://sparetext.dev/mcp" }
  }
}
```

Then run `/mcp auth sparetext` in Gemini CLI and sign in.

## Any other MCP client

Point it at `https://sparetext.dev/mcp` (Streamable HTTP). For sign-in it
supports OAuth with Client ID Metadata Documents or dynamic client
registration; otherwise send `Authorization: Bearer <API key>`. The server card
at https://sparetext.dev/.well-known/mcp.json describes it as JSON. Gemini,
Perplexity, Le Chat, OpenClaw and n8n steps are at https://sparetext.dev/agents.

## Check it works

Ask the agent to call `list_devices`. It should list the user's phones and
whether each is online. If the tools don't show up, restart the agent or start
a new session.
