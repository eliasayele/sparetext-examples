<?php
/**
 * Plugin Name:       Sparetext SMS
 * Plugin URI:        https://github.com/eliasayele/sparetext-examples/tree/main/wordpress
 * Description:       Texts you about new WooCommerce orders and contact form messages, texts customers when their order is complete, and passes on the replies, all from your own phone through Sparetext.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Sparetext
 * Author URI:        https://sparetext.dev
 * License:           MIT
 *
 * Settings go in wp-config.php, above the "That's all, stop editing!" line, so the key never sits in
 * the database or in a backup of it:
 *
 *   define('SPARETEXT_API_KEY', 'spt_live_...');        // https://sparetext.dev/keys
 *   define('SPARETEXT_NOTIFY', '+12025550100');         // your number: new orders and form messages
 *   define('SPARETEXT_WEBHOOK_SECRET', 'whsec_...');    // optional: texts people send back
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sends one text from your phone. Returns the API's answer, or a WP_Error that is also written to the
 * PHP error log. $key is an Idempotency-Key: the same key twice within 24 hours queues the text once.
 */
function sparetext_send(string $to, string $text, string $key = '')
{
    if (!defined('SPARETEXT_API_KEY') || SPARETEXT_API_KEY === '') {
        return new WP_Error('sparetext_no_key', 'Add SPARETEXT_API_KEY to wp-config.php.');
    }
    $server = defined('SPARETEXT_SERVER') ? SPARETEXT_SERVER : 'https://sparetext.dev';
    $headers = ['x-api-key' => SPARETEXT_API_KEY, 'content-type' => 'application/json'];
    if ($key !== '') {
        // Prefixed with this site, so two sites on one Sparetext account never share a key.
        $headers['idempotency-key'] = 'wp-' . substr(md5(home_url()), 0, 8) . '-' . $key;
    }
    $res = wp_remote_post("$server/api/v1/messages", [
        'headers' => $headers,
        'body'    => wp_json_encode(['to' => $to, 'text' => $text]),
        'timeout' => 15,
    ]);
    if (is_wp_error($res)) {
        error_log('Sparetext: ' . $res->get_error_message());
        return $res;
    }
    $status = wp_remote_retrieve_response_code($res);
    $body = json_decode(wp_remote_retrieve_body($res), true);
    if ($status >= 400) {
        $error = new WP_Error('sparetext_' . ($body['error']['code'] ?? 'error'), $body['error']['message'] ?? "HTTP $status");
        error_log("Sparetext: $status " . $error->get_error_message());
        return $error;
    }
    return $body;
}

/**
 * Sends in the background where WooCommerce's Action Scheduler is there, so a checkout never waits
 * on the network; anywhere else it sends straight away.
 */
function sparetext_send_later(string $to, string $text, string $key = ''): void
{
    if (function_exists('as_enqueue_async_action')) {
        as_enqueue_async_action('sparetext_send', [$to, $text, $key], 'sparetext');
    } else {
        sparetext_send($to, $text, $key);
    }
}
add_action('sparetext_send', 'sparetext_send', 10, 3);

/* WooCommerce ------------------------------------------------------------------------------------ */

// It reads and writes orders only through the order object, so it works with HPOS, WooCommerce's
// order tables (on by default in new shops). Saying so keeps WooCommerce from flagging the plugin.
add_action('before_woocommerce_init', function () {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

add_action('woocommerce_order_status_changed', function ($order_id, $from, $to, $order) {
    // A new order, paid (processing) or waiting for a bank transfer or cash on delivery (on-hold):
    // one text to you, even when it moves from on-hold to processing later.
    if (in_array($to, ['processing', 'on-hold'], true) && defined('SPARETEXT_NOTIFY') && !$order->get_meta('_sparetext_new_order')) {
        $order->update_meta_data('_sparetext_new_order', time());
        $order->save();
        // "USD 24.50", not wc_price(): its HTML hides a no-break space, which isn't in GSM-7, so the
        // whole text would go as UCS-2 and fit 70 characters a part instead of 160.
        $text = sprintf(
            'New order #%s: %s %s from %s %s.',
            $order->get_order_number(),
            $order->get_currency(),
            wc_format_decimal($order->get_total(), wc_get_price_decimals()),
            $order->get_billing_first_name(),
            $order->get_billing_last_name()
        );
        sparetext_send_later(SPARETEXT_NOTIFY, apply_filters('sparetext_new_order_text', $text, $order), "order-$order_id-new");
    }

    // Done: one text to the customer, if they gave a phone number at checkout.
    if ($to === 'completed' && $order->get_billing_phone() && !$order->get_meta('_sparetext_completed')) {
        $order->update_meta_data('_sparetext_completed', time());
        $order->save();
        $text = sprintf(
            'Hi %s, your order #%s from %s is complete. Thank you!',
            $order->get_billing_first_name(),
            $order->get_order_number(),
            wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES)
        );
        sparetext_send_later($order->get_billing_phone(), apply_filters('sparetext_order_completed_text', $text, $order), "order-$order_id-completed");
    }
}, 10, 4);

/* Contact Form 7 --------------------------------------------------------------------------------- */

// Before the email goes out, not after: if the site's email fails, which WordPress email often does,
// you still hear about the message.
add_action('wpcf7_before_send_mail', function ($form, &$abort, $submission) {
    if (!defined('SPARETEXT_NOTIFY') || !$submission) {
        return;
    }
    $data = $submission->get_posted_data();
    $who = trim(($data['your-name'] ?? '') . ' ' . (isset($data['your-email']) ? "<{$data['your-email']}>" : ''));
    $what = wp_html_excerpt((string) ($data['your-message'] ?? ''), 200, '...');
    $text = sprintf('New message on %s from %s: %s', $form->title(), $who ?: 'someone', $what);
    sparetext_send(SPARETEXT_NOTIFY, apply_filters('sparetext_form_text', $text, $form, $data));
}, 10, 3);

/* Replies ---------------------------------------------------------------------------------------- */

// Sparetext posts each text your phone receives to https://your-site/wp-json/sparetext/v1/incoming.
add_action('rest_api_init', function () {
    register_rest_route('sparetext/v1', '/incoming', [
        'methods'             => 'POST',
        'permission_callback' => '__return_true', // the signature check below is the lock
        'callback'            => 'sparetext_incoming',
    ]);
});

function sparetext_incoming(WP_REST_Request $request)
{
    $raw = $request->get_body(); // the bytes as they arrived: the signature covers exactly these
    $secret = defined('SPARETEXT_WEBHOOK_SECRET') ? SPARETEXT_WEBHOOK_SECRET : '';
    if ($secret === '' || !sparetext_signed($raw, (string) $request->get_header('x-sparetext-signature'), $secret)) {
        return new WP_REST_Response(['error' => 'bad signature'], 401);
    }
    $event = json_decode($raw, true);
    // A webhook that didn't get a 2xx in time is sent again with the same id: handle each id once.
    $seen = 'sparetext_evt_' . md5((string) ($event['id'] ?? ''));
    if (get_transient($seen)) {
        return new WP_REST_Response(null, 200);
    }
    set_transient($seen, 1, 4 * DAY_IN_SECONDS);

    if (($event['type'] ?? '') === 'message.received') {
        $message = $event['data']['message'];
        do_action('sparetext_message_received', $message);
        wp_mail(get_option('admin_email'), "Text from {$message['contact']}", $message['text']);
    }
    return new WP_REST_Response(null, 200);
}

/** X-Sparetext-Signature is t=<unix time>,v1=<HMAC-SHA256 of "<t>.<raw body>" with the webhook's secret>. */
function sparetext_signed(string $raw, string $header, string $secret): bool
{
    if (!preg_match('/(?:^|,)t=(\d+)/', $header, $t) || abs(time() - (int) $t[1]) > 300) {
        return false; // missing, or more than five minutes off: maybe a replayed request
    }
    $want = hash_hmac('sha256', "$t[1].$raw", $secret);
    preg_match_all('/v1=([0-9a-f]{64})/', $header, $v1);
    foreach ($v1[1] as $got) {
        if (hash_equals($want, $got)) {
            return true; // two v1 values for a day after the secret is rotated
        }
    }
    return false;
}
