#!/usr/bin/env python3
"""Send a text through Sparetext with Twilio's own Python client: the code you'd write for Twilio,
plus one line that points the client at Sparetext. Then fetch it the Twilio way until the phone
has sent it.

    pip install -r requirements.txt          # twilio, pinned
    export TWILIO_ACCOUNT_SID=AC...          # yours, or any value starting with AC: it isn't checked
    export SPARETEXT_API_KEY=spt_live_...    # https://sparetext.dev/keys, in place of the Auth Token
    python3 send.py +12025550123 "Your order is ready for pickup."

Set STATUS_CALLBACK to a URL to hear each change as Twilio posts it.
"""
import os
import sys
import time

from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

if len(sys.argv) != 3:
    sys.exit('Usage: python3 send.py +12025550123 "Your text"')
to, body = sys.argv[1], sys.argv[2]

client = Client(os.environ.get("TWILIO_ACCOUNT_SID", "ACsparetext"), os.environ["SPARETEXT_API_KEY"])
client.api.base_url = os.environ.get("SPARETEXT_SERVER", "https://sparetext.dev")  # the one new line

try:
    extra = {"status_callback": os.environ["STATUS_CALLBACK"]} if os.environ.get("STATUS_CALLBACK") else {}
    message = client.messages.create(to=to, body=body, **extra)
    print(f"{message.sid} to {message.to}: {message.status}")
    # Twilio's fetch works too: follow the text until the phone has sent it (or a minute passes).
    for _ in range(20):
        if message.status not in ("queued", "scheduled", "sending"):
            break
        time.sleep(3)
        message = client.messages(message.sid).fetch()
        failure = f" ({message.error_code}: {message.error_message})" if message.error_code else ""
        print(f"{message.sid}: {message.status}{failure}")
except TwilioRestException as e:
    # A refusal carries Twilio's code: 21211 for a bad number, 21610 for one that opted out.
    sys.exit(f"{e.status} {e.code}: {e.msg}")
