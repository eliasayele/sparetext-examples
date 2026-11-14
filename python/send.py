#!/usr/bin/env python3
"""Send a text from your own phone through Sparetext. Standard library only.

    export SPARETEXT_API_KEY=spt_live_...
    python3 send.py +12025550123 "Your order is ready for pickup."
"""
import json
import os
import sys
import urllib.error
import urllib.request

SERVER = os.environ.get("SPARETEXT_SERVER", "https://sparetext.dev").rstrip("/")


def api(method, path, body=None):
    """Call the Sparetext API and return the JSON answer, or exit with its error."""
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


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit('Usage: python3 send.py +12025550123 "Your text"')
    to, text = sys.argv[1], sys.argv[2]
    answer = api("POST", "/messages", {"to": to, "text": text})
    message = answer["messages"][0]
    print(f"Queued {message['id']} to {message['contact']}: the phone sends it in a few seconds.")
