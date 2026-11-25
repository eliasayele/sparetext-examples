# Sparetext SMS for WordPress

A small plugin, one PHP file, that sends texts from your own phone through [Sparetext](https://sparetext.dev):

- **A new WooCommerce order** texts you: `New order #1042: USD 24.50 from Ana Lopez.` Once per order, paid (processing) or waiting for payment (on-hold).
- **An order marked Completed** texts the customer, if they gave a phone number at checkout: `Hi Ana, your order #1042 from Mesi's Bakery is complete. Thank you!`
- **A Contact Form 7 message** texts you, before WordPress tries to email it, so you hear about it even when the email never arrives.
- **Replies** people text back to your phone come to `/wp-json/sparetext/v1/incoming`, signed; the plugin checks the signature, handles each event once, emails them to the site's admin address and fires `sparetext_message_received` for your own code.

It reads and writes orders only through WooCommerce's order object and declares itself compatible with HPOS, WooCommerce's order tables, so WooCommerce doesn't flag it. Texts go out from your phone's own number, so a customer's reply comes back to you.

## Install

1. Copy the [`sparetext-sms`](sparetext-sms/) folder to `wp-content/plugins/` (or zip it and upload it under Plugins › Add New › Upload Plugin) and activate **Sparetext SMS**.
2. In Sparetext, make an API key on the [API keys page](https://sparetext.dev/keys), and pair your phone.
3. Add these lines to `wp-config.php`, above `/* That's all, stop editing! */`:

```php
define('SPARETEXT_API_KEY', 'spt_live_...');      // the key
define('SPARETEXT_NOTIFY', '+12025550100');       // your number, for new orders and form messages
define('SPARETEXT_WEBHOOK_SECRET', 'whsec_...');  // optional, for replies (step 4)
```

4. For replies: on Sparetext's Webhooks page, add `https://your-site.com/wp-json/sparetext/v1/incoming` with **Text received** ticked, and copy its secret into `SPARETEXT_WEBHOOK_SECRET`.

The key lives in `wp-config.php`, not in the database, so it isn't in a database export, a staging copy or a backup plugin's archive.

## Good to know

- **Numbers.** WooCommerce keeps the phone as the customer typed it. A number without `+` and a country code is read in your Sparetext account's country (Settings › Phone numbers), so `(202) 555-0157` works for a US shop. Anything that isn't a number for that country fails with a clear error in the PHP error log.
- **No slow checkouts.** Order texts go through WooCommerce's Action Scheduler in the background, so a customer never waits on the network. Contact form texts go straight out.
- **No double texts.** Each order text carries an Idempotency-Key (`order-1042-new`), and the order remembers it was texted, so a status that flips back and forth or a retried background job sends once.
- **GSM-7.** The order text says `USD 24.50`, not WooCommerce's formatted price: that has a no-break space in its HTML, which isn't in the GSM-7 alphabet, so the whole text would be sent as UCS-2 and fit 70 characters a part instead of 160.
- **Your words.** Change any text with a filter in your theme's `functions.php`:

```php
add_filter('sparetext_order_completed_text', function ($text, $order) {
    return "Hi {$order->get_billing_first_name()}, order #{$order->get_order_number()} is on its way!";
}, 10, 2);
```

  The filters are `sparetext_new_order_text`, `sparetext_order_completed_text` and `sparetext_form_text`. Send your own texts anywhere with `sparetext_send('+12025550123', 'Your booking is confirmed.')`.

- **Other form plugins.** The same `sparetext_send()` call works from their hooks: `wpforms_process_complete` in WPForms and `gform_after_submission` in Gravity Forms.
- Only text customers about their own order, and keep marketing texts to people who opted in. Carriers filter business texts sent by software, even from a personal number.

## Tested

On 25 November 2026, in WordPress Playground (WordPress 7.1.5, WooCommerce 11.3.1, Contact Form 7 6.2.6, PHP 8.3), against a local copy of Sparetext with a simulated Android phone:

- Two test orders went on-hold → processing → completed. Each sent one text to the shop (`New order #11: USD 24.50 from Ana Lopez.`) and one to the customer, whose phone was typed as `(202) 555-0157` and `202-555-0161` and arrived as `+12025550157` and `+12025550161`. That was WooCommerce's classic order storage; Playground's SQLite database wouldn't switch on HPOS, so HPOS itself wasn't tried.
- A Contact Form 7 submission through its own REST endpoint texted the shop, and the form's email still went out.
- A reply came back as a real signed webhook and was emailed to the admin. Sparetext's first try waited longer than 5 seconds for Playground (it runs PHP in WebAssembly), so it tried again 5 seconds later: the second try got a 200 and the reply was emailed once. A POST without a signature got a 401.

Step by step, with the why behind each part: [How to send SMS from WordPress and WooCommerce](https://sparetext.dev/blog/send-sms-from-wordpress).

MIT licensed, like the rest of this repository.
