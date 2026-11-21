#!/usr/bin/env bash
# Twilio's own "send an SMS" curl call with two things changed: the host, and the password (your
# Sparetext API key in place of the Auth Token). The text goes out from your own phone.
#
#   export TWILIO_ACCOUNT_SID=AC...          # yours, or any value starting with AC: it isn't checked
#   export SPARETEXT_API_KEY=spt_live_...    # https://sparetext.dev/keys
#   ./send.sh +12025550123 "Your order is ready for pickup."
set -euo pipefail

usage='Usage: ./send.sh +12025550123 "Your text"'
TO="${1:?$usage}"
BODY="${2:?$usage}"
SERVER="${SPARETEXT_SERVER:-https://sparetext.dev}"   # was https://api.twilio.com
ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-ACsparetext}"

curl -sS -X POST "$SERVER/2010-04-01/Accounts/$ACCOUNT_SID/Messages.json" \
  -u "$ACCOUNT_SID:$SPARETEXT_API_KEY" \
  --data-urlencode "To=$TO" \
  --data-urlencode "Body=$BODY"
echo
