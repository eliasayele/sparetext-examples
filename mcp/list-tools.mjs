// Talk to Sparetext's MCP server the way an MCP client does, with an API key as the bearer token:
// list its tools, then call list_devices. Node 18 or newer, no packages.
//
//   export SPARETEXT_API_KEY=spt_live_...
//   node list-tools.mjs

const server = (process.env.SPARETEXT_SERVER ?? "https://sparetext.dev").replace(/\/$/, "");
const PROTOCOL = "2025-06-18";
let id = 0;

async function rpc(method, params = {}) {
  const res = await fetch(`${server}/mcp`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.SPARETEXT_API_KEY}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": PROTOCOL,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

const init = await rpc("initialize", {
  protocolVersion: PROTOCOL,
  capabilities: {},
  clientInfo: { name: "sparetext-examples", version: "1.0.0" },
});
console.log(`${init.serverInfo.name} ${init.serverInfo.version}, protocol ${init.protocolVersion}\n`);

const { tools } = await rpc("tools/list");
for (const tool of tools) console.log(`${tool.name.padEnd(26)} ${tool.description.split(". ")[0]}`);

const devices = await rpc("tools/call", { name: "list_devices", arguments: {} });
console.log(`\nlist_devices:\n${devices.content.map((c) => c.text).join("\n")}`);
