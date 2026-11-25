# Sparetext with PHP

Send and receive SMS from your own phone in PHP 7.4 or newer, with the cURL extension that ships with almost every PHP install: no Composer package.

```bash
export SPARETEXT_API_KEY=spt_live_...   # https://sparetext.dev/keys
php -m | grep curl                      # check the cURL extension is there
```

| File | What it does |
|---|---|
| [`sparetext.php`](sparetext.php) | `sparetext()`, one function for every API call that throws with the API's own error, and `sparetext_send()`, a send that is safe to retry (Idempotency-Key, and it waits out a `429` for as long as `Retry-After` says) |
| [`send.php`](send.php) | Send one text and follow it to `delivered`: `php send.php +12025550123 "Your order is ready for pickup."` |
| [`webhook.php`](webhook.php) | Take the texts your phone receives as signed webhooks and check each signature: `php -S 127.0.0.1:8000 webhook.php` |

The shortest send, without the helper:

```php
<?php
$ch = curl_init('https://sparetext.dev/api/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['x-api-key: ' . getenv('SPARETEXT_API_KEY'), 'content-type: application/json'],
    CURLOPT_POSTFIELDS => json_encode(['to' => '+12025550123', 'text' => 'Your order is ready for pickup.']),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
]);
echo curl_exec($ch);
```

`curl_exec` returns `false` only when the network fails; a `401` or `422` comes back as a normal answer, so check `curl_getinfo($ch, CURLINFO_RESPONSE_CODE)` as `sparetext()` does.

## WordPress and WooCommerce

[`../wordpress/`](../wordpress/) has a small plugin that texts you about new WooCommerce orders and contact form messages, texts customers when their order is complete, and passes on replies.

## Laravel, Symfony and other frameworks

`from_sparetext()` in [`webhook.php`](webhook.php) takes the raw body and the `X-Sparetext-Signature` header. The raw body is `$request->getContent()` in Laravel and Symfony. Check it before you parse the JSON, and answer within 5 seconds.

More in the [API reference](https://sparetext.dev/docs) and [Send SMS from PHP](https://sparetext.dev/blog/send-sms-from-php).
