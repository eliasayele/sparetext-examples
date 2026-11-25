=== Sparetext SMS ===
Contributors: your-wordpress-username
Tags: sms, woocommerce, contact form 7, sms notifications, order notifications
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Texts you about new WooCommerce orders and Contact Form 7 messages, and texts customers when an order is done, from your own phone and number.

== Description ==

Sparetext SMS sends texts from the phone you already own. It goes through [Sparetext](https://sparetext.dev), a service that turns an Android phone or an iPhone into an SMS gateway, so the texts leave from your own number: there is no SMS provider to sign up with, no number to rent, and when a customer replies, the reply comes back to you.

What it does:

* **A new WooCommerce order texts you**, once per order, whether it's paid (Processing) or waiting for a bank transfer or cash on delivery (On hold): `New order #1042: USD 24.50 from Ana Lopez.`
* **An order marked Completed texts the customer**, if they gave a phone number at checkout: `Hi Ana, your order #1042 from Mesi's Bakery is complete. Thank you!`
* **A Contact Form 7 message texts you**, before WordPress tries to email it, so you hear about it even when the email never arrives.
* **Replies come back.** When someone texts your phone, Sparetext posts it to your site. The plugin checks the signature, handles each reply once, and emails it to the site's admin address.

WooCommerce and Contact Form 7 are both optional: each part runs only when its plugin is active.

The details:

* Order texts go out in the background through WooCommerce's Action Scheduler, so checkout never waits on the network.
* No double texts: each order remembers it was texted, and each order text carries an Idempotency-Key, so a status that flips back and forth or a retried job still sends one text.
* The order text says `USD 24.50`, not WooCommerce's formatted price. That one has a no-break space, which isn't in GSM-7, the alphabet a normal text uses; it would switch the whole text to UCS-2, where a part holds 70 characters instead of 160.
* Compatible with HPOS, WooCommerce's order tables.
* No settings page: your API key goes in `wp-config.php`, so it never sits in the database, a database export, a staging copy or a backup.
* Change any text with a filter (`sparetext_new_order_text`, `sparetext_order_completed_text`, `sparetext_form_text`), act on replies with the `sparetext_message_received` action, and send your own texts from any code with `sparetext_send( '+12025550123', 'Your booking is confirmed.' )`.

The plugin is one short PHP file you can read in a few minutes. The walkthrough, with the reason behind each part: [How to send SMS from WordPress and WooCommerce](https://sparetext.dev/blog/send-sms-from-wordpress). Source and issues: [GitHub](https://github.com/eliasayele/sparetext-examples/tree/main/wordpress).

== External services ==

This plugin connects to Sparetext (https://sparetext.dev), the service that passes each text to your paired phone, which sends it from your number. Sparetext is made by the authors of this plugin. You need a Sparetext account (Free covers 1 phone and 300 texts a month) and an API key. Nothing is sent until you add `SPARETEXT_API_KEY` to `wp-config.php`.

What is sent, and when:

* When a WooCommerce order first reaches Processing or On hold, if `SPARETEXT_NOTIFY` is set: your number from `SPARETEXT_NOTIFY`, and the text, which holds the order number, the total and currency, and the customer's billing first and last name.
* When an order reaches Completed, if the customer gave a phone number: the customer's billing phone number, and the text, which holds their first name, the order number and your site's name.
* When a Contact Form 7 form is sent, if `SPARETEXT_NOTIFY` is set: your number, and the text, which holds the form's title, the sender's name and email, and the first 200 characters of their message.
* When your own code calls `sparetext_send()`: the number and the text it passes.

Each of these is one HTTPS request to `https://sparetext.dev/api/v1/messages` carrying your API key. Order texts also carry an Idempotency-Key made from a hash of your site's address and the order ID. Sparetext keeps the numbers and texts in your account, so you can see what was sent, until you delete them or the account.

Replies work the other way round: if you set `SPARETEXT_WEBHOOK_SECRET` and add the webhook in Sparetext, Sparetext sends the texts your phone receives to your site at `/wp-json/sparetext/v1/incoming`. The plugin makes no outgoing request for that.

Sparetext's [Terms of use](https://sparetext.dev/terms) and [Privacy policy](https://sparetext.dev/privacy).

== Installation ==

1. Install and activate Sparetext SMS.
2. Make a free account at [sparetext.dev](https://sparetext.dev) and pair your phone with the Sparetext app (Android), or an iPhone as the [iPhone guide](https://sparetext.dev/iphone-sms-gateway) shows.
3. Make an API key on Sparetext's [API keys page](https://sparetext.dev/keys).
4. Add the three lines below to `wp-config.php`, above the line that says "That's all, stop editing!".
5. For replies: on Sparetext's Webhooks page, add `https://your-site.com/wp-json/sparetext/v1/incoming` with **Text received** ticked, and copy its secret into `SPARETEXT_WEBHOOK_SECRET`.
6. Place a test order, or send your contact form, and your phone will text you.

The lines for `wp-config.php`:

    define('SPARETEXT_API_KEY', 'spt_live_...');      // the key
    define('SPARETEXT_NOTIFY', '+12025550100');       // your number, for new orders and form messages
    define('SPARETEXT_WEBHOOK_SECRET', 'whsec_...');  // optional, for replies (step 5)

== Frequently Asked Questions ==

= Do I need an SMS provider or a number from one? =

No. The texts go out from your own phone, on your own number and your own mobile plan, and Sparetext charges no fee per text. Sparetext Free covers 1 phone and 300 texts a month; Pro covers 10,000 texts a month on up to 5 phones ([pricing](https://sparetext.dev/pricing)).

= Why is there no settings page? =

Anything saved in the admin lives in the database, and the database gets copied around: a staging site, a backup plugin's archive, a SQL dump sent to a developer. `wp-config.php` stays on the server.

= The customer typed their number without a country code. Does it still work? =

Yes. WooCommerce keeps the phone as the customer typed it. A number without `+` and a country code is read in your Sparetext account's country (Settings, Phone numbers), so `(202) 555-0157` works for a US shop. A number that can't be in that country fails with a clear error.

= Where do I see a text that failed? =

In the PHP error log (`wp-content/debug.log` when `WP_DEBUG_LOG` is on), as a line that starts with `Sparetext:` and gives the reason, and in your Sparetext account, which lists every text and its status.

= Can I change the words? =

Yes, with a filter in your theme's `functions.php`, without touching the plugin:

    add_filter('sparetext_order_completed_text', function ($text, $order) {
        return "Hi {$order->get_billing_first_name()}, order #{$order->get_order_number()} is on its way!";
    }, 10, 2);

= Does it work with WPForms or Gravity Forms? =

Not out of the box. Call `sparetext_send()` from their hooks: `wpforms_process_complete` in WPForms, `gform_after_submission` in Gravity Forms.

= Can I send marketing texts or a newsletter? =

A phone is for texts to people who know you: order updates, booking reminders, alerts to you or your team. Only text customers about their own order, and keep marketing to people who asked for it. Carriers filter business texts sent by software, even from a personal number, and an Android phone sends about 30 texts a minute.

= Does it work with an iPhone? =

Yes, within what Apple allows: no iPhone app can send a text in the background on its own. With Sparetext for Mac and Text Message Forwarding on, a Mac sends the texts through Messages, from the iPhone's number, with no tap. Without a Mac, the Sparetext iPhone app sends while it's open, or you tap Send for each text. The [iPhone guide](https://sparetext.dev/iphone-sms-gateway) has the details. An Android phone sends in the background with nothing else needed.

== Screenshots ==

1. Every text the plugin sent, in your Sparetext account: new order and contact form alerts to the shop, and order updates to customers, each delivered from the shop's own phone.
2. A customer's reply lands in the same conversation on your phone, and reaches your site as a signed webhook that the plugin emails to you.
3. For replies, add your site's /wp-json/sparetext/v1/incoming address on Sparetext's Webhooks page with Text received ticked.

== Changelog ==

= 1.0.0 =
* First release: texts for new WooCommerce orders, completed orders and Contact Form 7 messages, and replies by signed webhook.
