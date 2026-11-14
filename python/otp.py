#!/usr/bin/env python3
"""Text a one-time code from your own number, then check the code the person types.

    export SPARETEXT_API_KEY=spt_live_...
    python3 otp.py +12025550123

Standard library only. In a real sign-in, keep the verification id with the sign-in
attempt and check the code when the person submits the form.
"""
import json
import os
import sys
import urllib.error
import urllib.request

SERVER = os.environ.get("SPARETEXT_SERVER", "https://sparetext.dev").rstrip("/")


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
        return json.load(e)  # a wrong or expired code answers with an error to show the person


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python3 otp.py +12025550123")
    started = api("POST", "/verify", {"to": sys.argv[1]})
    if "error" in started:
        sys.exit(started["error"]["message"])
    verification_id = started["verification"]["id"]
    print(f"Code sent ({verification_id}).")

    while True:
        code = input("Code from the text: ").strip()
        result = api("POST", f"/verify/{verification_id}/check", {"code": code})
        if result.get("valid"):
            print("That's right: the number is verified.")
            return
        if "error" in result:  # 429 too_many_tries after five wrong codes
            sys.exit(result["error"]["message"])
        if result["verification"]["status"] == "expired":
            sys.exit("This code has expired. Send a new one.")
        print("That code isn't right. Try again.")


if __name__ == "__main__":
    main()
