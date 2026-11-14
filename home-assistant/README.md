# Sparetext with Home Assistant

Send SMS from any Home Assistant automation through your own Android phone (or an iPhone with Sparetext for Mac), with no USB modem and no SMS provider. A text to that phone can start an automation too.

Home Assistant only has to reach `sparetext.dev` over HTTPS, so this works the same on Home Assistant OS on a Raspberry Pi, in a VM or in Docker.

## Send a text from an automation

1. Make a key on the [API keys page](https://sparetext.dev/keys) and put it in `secrets.yaml`: `sparetext_api_key: spt_live_...`
2. Add the notifier in [`configuration.yaml`](configuration.yaml) and restart Home Assistant.
3. Try it in **Developer tools › Actions**: choose `notify.sparetext`, set a message and your own number as the target, and run it.

Then any trigger can text you: a door, a leak sensor, a freezer's temperature. See the first automation in [`automations.yaml`](automations.yaml).

## Start an automation when a text arrives

Sparetext posts each text the phone receives to a webhook, and Home Assistant's webhook trigger turns it into an automation (the second one in [`automations.yaml`](automations.yaml)). Home Assistant must be reachable from the internet over HTTPS for this, and the trigger needs `local_only: false`.

1. Make a long, random webhook ID: Home Assistant treats it like a password.
2. In Sparetext, open **Webhooks › Add webhook**, paste `https://YOUR-HOME-ASSISTANT/api/webhook/YOUR-WEBHOOK-ID` and keep **Text received** ticked.
3. A new phone saves only texts from people you've texted, so text the phone once from the number that will send commands, or choose Everyone in the phone's menu on the Phones page.

Anyone who learns a webhook ID can call it, and a phone number can be spoofed, so check the sender as the example does, and keep texts away from locks, alarms and garage doors.

More: [sparetext.dev/home-assistant-sms](https://sparetext.dev/home-assistant-sms).
