#!/usr/bin/env python3
"""Receive the texts your phone gets as signed webhooks. Standard library only.

    export SPARETEXT_WEBHOOK_SECRET=whsec_...   # Webhooks > your webhook > Details and signing secret
    python3 webhook_receiver.py                 # listens on http://0.0.0.0:3000

Sparetext posts to a public https URL, so put this behind your own domain or a tunnel,
and add that URL on the Webhooks page with the Text received event.
"""
import hashlib
import hmac
import json
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ["SPARETEXT_WEBHOOK_SECRET"]
PORT = int(os.environ.get("PORT", "3000"))
handled = set()  # keep event ids in your database instead


def from_sparetext(raw_body, header, secret):
    """raw_body: the request body as bytes. header: the X-Sparetext-Signature value."""
    pairs = [p.strip().split("=", 1) for p in (header or "").split(",") if "=" in p]
    t = next((v for k, v in pairs if k == "t"), "")
    if not (t.isascii() and t.isdigit()) or abs(time.time() - int(t)) > 300:
        return False  # no timestamp, or more than 5 minutes off: refuse it
    signed = t.encode() + b"." + raw_body
    want = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest().encode()
    # For a day after you rotate the secret there are two v1= signatures: either may be yours.
    return any(hmac.compare_digest(want, v.encode()) for k, v in pairs if k == "v1")


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get("content-length", 0)))
        if not from_sparetext(raw, self.headers.get("x-sparetext-signature"), SECRET):
            self.send_response(401)
            self.end_headers()
            return
        # Answer within 5 seconds, then do the work. No answer in time counts as failed and is retried.
        self.send_response(200)
        self.end_headers()

        event = json.loads(raw)
        if event["id"] in handled:
            return  # a retry of an event you already have
        handled.add(event["id"])
        if event["type"] == "message.received":
            message = event["data"]["message"]
            print(f"Text from {message['contact']}: {message['text']}", flush=True)
        elif event["type"] in ("message.delivered", "message.failed"):
            message = event["data"]["message"]
            print(f"{message['id']} is {message['status']}", flush=True)
        else:
            print(f"Event: {event['type']}", flush=True)

    def log_message(self, *args):
        pass  # keep the output to the texts themselves


if __name__ == "__main__":
    print(f"Listening on http://0.0.0.0:{PORT}", flush=True)
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
