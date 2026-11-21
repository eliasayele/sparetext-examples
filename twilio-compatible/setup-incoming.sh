#!/usr/bin/env bash
# Points the texts your phone receives at a handler written for Twilio, the way a Twilio number's
# "A message comes in" URL does. It makes an automation that posts each text as Twilio's form
# fields, signed in X-Twilio-Signature, and texts a TwiML <Message> answer back to the sender.
# Needs a key without limits (on the API keys page, clear the key's limits) or do it in the
# dashboard: Automations, Call a URL, Twilio handler.
#
#   export SPARETEXT_API_KEY=spt_live_...
#   ./setup-incoming.sh https://your-tunnel.example/sms
set -euo pipefail

URL="${1:?Usage: ./setup-incoming.sh https://your-server.example/sms}"
SERVER="${SPARETEXT_SERVER:-https://sparetext.dev}"

curl -sS -X POST "$SERVER/api/v1/automations" \
  -H "x-api-key: $SPARETEXT_API_KEY" -H "content-type: application/json" \
  -d "{\"name\": \"Twilio handler\", \"trigger\": {\"match\": \"any\"}, \"actions\": [{\"type\": \"webhook\", \"url\": \"$URL\", \"contentType\": \"twilio\", \"reply\": true}]}"
echo
echo "The automation's secret is in that answer (\"secret\"): set it as SPARETEXT_AUTOMATION_SECRET for incoming.mjs."
