<?php
// Takes the texts your phone receives, posted by Sparetext as signed webhooks, and checks each signature.
// Try it on your machine:  SPARETEXT_WEBHOOK_SECRET=whsec_... php -S 127.0.0.1:8000 webhook.php
// On a server, put it behind https and add its URL on the Webhooks page with "Text received" ticked.

/** X-Sparetext-Signature is t=<unix time>,v1=<HMAC-SHA256 of "<t>.<raw body>" with the webhook's secret>. */
function from_sparetext(string $raw, string $header, string $secret): bool
{
    if (!preg_match('/(?:^|,)t=(\d+)/', $header, $t) || abs(time() - (int) $t[1]) > 300) {
        return false; // missing, or more than five minutes off: maybe a replayed request
    }
    $want = hash_hmac('sha256', "$t[1].$raw", $secret);
    preg_match_all('/v1=([0-9a-f]{64})/', $header, $v1);
    foreach ($v1[1] as $got) {
        if (hash_equals($want, $got)) {
            return true; // there are two v1 values for a day after you rotate the secret
        }
    }
    return false;
}

$raw = file_get_contents('php://input'); // the bytes exactly as they arrived; $_POST is empty for JSON
$header = $_SERVER['HTTP_X_SPARETEXT_SIGNATURE'] ?? '';
if (!from_sparetext($raw, $header, (string) getenv('SPARETEXT_WEBHOOK_SECRET'))) {
    http_response_code(401);
    exit;
}

$event = json_decode($raw, true);
// A try that didn't get a 2xx within 5 seconds is sent again with the same id: handle each id once
// (keep the ids you've handled in your database; this example just logs).
if ($event['type'] === 'message.received') {
    $text = $event['data']['message'];
    error_log("{$event['id']}: {$text['contact']} said: {$text['text']}");
}
http_response_code(200);
