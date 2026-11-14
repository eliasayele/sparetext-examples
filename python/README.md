# Sparetext with Python

Send and receive SMS from your own phone in Python 3.8 or newer, with the standard library only: nothing to install.

```bash
export SPARETEXT_API_KEY=spt_live_...   # https://sparetext.dev/keys
```

| Script | What it does |
|---|---|
| [`send.py`](send.py) | Send one text: `python3 send.py +12025550123 "Your order is ready for pickup."` |
| [`send_and_wait.py`](send_and_wait.py) | Send a question, follow it to `delivered`, and print the reply when it comes |
| [`webhook_receiver.py`](webhook_receiver.py) | A server that takes the texts your phone receives as signed webhooks and checks each signature |
| [`otp.py`](otp.py) | Text a one-time code and check what the person types |

With [requests](https://pypi.org/project/requests/) the send is three lines:

```python
import os, requests

r = requests.post(
    "https://sparetext.dev/api/v1/messages",
    headers={"x-api-key": os.environ["SPARETEXT_API_KEY"]},
    json={"to": "+12025550123", "text": "Your order is ready for pickup."},
)
print(r.json())
```

## Checking a webhook's signature in Flask, Django or FastAPI

`from_sparetext()` in [`webhook_receiver.py`](webhook_receiver.py) takes the raw body as bytes and the `X-Sparetext-Signature` header. The raw body is `request.get_data()` in Flask, `request.body` in Django and `await request.body()` in FastAPI. Check it before you parse the JSON, and answer within 5 seconds.

More in the [API reference](https://sparetext.dev/docs) and [Send SMS from Python](https://sparetext.dev/blog/send-sms-from-python).
