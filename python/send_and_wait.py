#!/usr/bin/env python3
"""Text someone from your own phone, follow the text until it's delivered, and wait for their reply.

    export SPARETEXT_API_KEY=spt_live_...
    python3 send_and_wait.py +12025550123 "Can you make 7pm tomorrow? Reply YES or NO."

Standard library only. For many conversations at once, use a webhook (webhook_receiver.py)
instead of polling.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

SERVER = os.environ.get("SPARETEXT_SERVER", "https://sparetext.dev").rstrip("/")
WAIT_MINUTES = 10


def api(method, path, body=None):
    request = urllib.request.Request(
        f"{SERVER}/api/v1{path}",
        method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={
            "x-api-key": os.environ["SPARETEXT_API_KEY"],
            "content-type": "application/json",
            "user-agent": "sparetext-examples/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as e:
        error = json.load(e).get("error", {})
        sys.exit(f"{e.code} {error.get('code')}: {error.get('message')}")


def main():
    if len(sys.argv) != 3:
        sys.exit('Usage: python3 send_and_wait.py +12025550123 "Your question"')
    to, text = sys.argv[1], sys.argv[2]

    sent = api("POST", "/messages", {"to": to, "text": text})["messages"][0]
    print(f"Queued {sent['id']}")

    status = sent["status"]
    deadline = time.time() + WAIT_MINUTES * 60
    reply = None
    while time.time() < deadline and reply is None:
        time.sleep(3)
        # Follow the text: queued, dispatched, sent, delivered (or failed, with the reason).
        message = api("GET", f"/messages/{sent['id']}")["message"]
        if message["status"] != status:
            status = message["status"]
            print(f"Status: {status}")
        if status == "failed":
            sys.exit(f"The text failed: {message.get('error')}")
        # Their reply: inbound texts from that number since we sent ours.
        query = urllib.parse.urlencode({"direction": "inbound", "contact": to, "since": sent["createdAt"]})
        replies = api("GET", f"/messages?{query}")["messages"]
        if replies:
            reply = replies[-1]  # newest first, so the last one is their first reply

    if reply is None:
        sys.exit(f"No reply within {WAIT_MINUTES} minutes.")
    print(f"Reply from {reply['contact']}: {reply['text']}")


if __name__ == "__main__":
    main()
