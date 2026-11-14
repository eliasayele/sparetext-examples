// Read the texts your phone received since the last run, oldest first, without a webhook.
// Run it from cron every minute. Node 18 or newer, no packages.
//
//   export SPARETEXT_API_KEY=spt_live_...
//   node read-new-texts.mjs
//
// It keeps its place in .sparetext-cursor, so each text is handled once.

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const server = (process.env.SPARETEXT_SERVER ?? "https://sparetext.dev").replace(/\/$/, "");
const cursorFile = new URL(".sparetext-cursor", import.meta.url);
let after = existsSync(cursorFile) ? readFileSync(cursorFile, "utf8").trim() : "";

for (;;) {
  const q = new URLSearchParams({ order: "asc", direction: "inbound", ...(after ? { after } : {}) });
  const res = await fetch(`${server}/api/v1/messages?${q}`, { headers: { "x-api-key": process.env.SPARETEXT_API_KEY } });
  const page = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${page.error.code}: ${page.error.message}`);

  for (const m of page.messages) {
    console.log(`${m.createdAt}  ${m.contact}: ${m.text}`); // your own handling goes here
  }
  after = page.after;
  writeFileSync(cursorFile, after ?? "");
  if (!page.hasMore) break;
}
