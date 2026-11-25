<?php
// Send one text from your phone and follow it until it's delivered (or two minutes pass).
//   php send.php +12025550123 "Your order is ready for pickup."
require __DIR__ . '/sparetext.php';

[, $to, $text] = $argv + [null, null, null];
if (!$to || !$text) {
    fwrite(STDERR, "Usage: php send.php +12025550123 \"Your order is ready for pickup.\"\n");
    exit(2);
}

try {
    $sent = sparetext_send(['to' => $to, 'text' => $text]);
} catch (SparetextError $e) {
    fwrite(STDERR, $e->getMessage() . "\n"); // e.g. 401 unauthorized: That key or token is not valid.
    exit(1);
}
$message = $sent['messages'][0];
echo "{$message['id']} {$message['status']}\n";

// queued → dispatched (the phone has it) → sent → delivered, when the carrier sends a delivery report.
$deadline = time() + 120;
while (!in_array($message['status'], ['delivered', 'failed', 'canceled'], true) && time() < $deadline) {
    sleep(3);
    $next = sparetext('GET', "/messages/{$message['id']}")['message'];
    if ($next['status'] !== $message['status']) {
        echo "{$next['id']} {$next['status']}" . (isset($next['error']) ? " ({$next['error']})" : '') . "\n";
    }
    $message = $next;
}
