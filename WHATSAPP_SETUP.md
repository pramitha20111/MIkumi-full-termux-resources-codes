# Mikumi WhatsApp bridge — setup notes

This project includes a small **official WhatsApp Cloud API webhook bridge for text chats only**. It is not connected to a real WhatsApp account until the owner completes Meta/eligible-provider onboarding and deploys the server at a stable public HTTPS URL.

## Preserve the existing WhatsApp Business app

The number is already registered in WhatsApp Business and the owner wants to keep using that app. Do **not** delete or deregister it. Use a Meta-compatible Coexistence / Embedded Signup flow with an eligible Tech Provider or Solution Partner. Standard Cloud API migration can change app access and message-history availability.

## Server configuration

Copy `whatsapp.env.example` to a private environment file on the deployed server and set the values from Meta/provider onboarding:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN` (choose a long random value; it is not an API token)
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_GRAPH_VERSION` (optional; default `v26.0`)

Never put real values in the APK, a public ZIP, Git, or a browser form. Configure them as deployment secrets/environment variables. The webhook URL is `https://YOUR_PUBLIC_HOST/webhook/whatsapp`; subscribe to the `messages` webhook field. The handler verifies Meta's `X-Hub-Signature-256` before processing. The webhook must be reachable over HTTPS and the process must remain online.

## Current scope and limitations

- Receives **text messages only**, generates a concise Sinhala/English reply through the configured Gemini provider, and sends a text reply using Cloud API.
- `GET /api/whatsapp/status` only reports whether server environment variables exist; it does not confirm Meta onboarding or number health.
- Images, outgoing voice notes, custom sticker favorites, cross-device chat/memory synchronization, Meta Embedded Signup UI/QR flow, proactive messages, and production-grade persistence/rate limiting are not implemented yet.
- Keep user actions permission-gated. Do not use unofficial WhatsApp Web QR/session automation.
- Follow Meta's messaging policies and template/customer-service window requirements. Do not send unsolicited WhatsApp messages.

## Live data endpoints

- `GET /api/weather?city=Negombo` — Open-Meteo geocoding + current/forecast data.
- `GET /api/news/lk` — Sri Lanka headline RSS results. Headlines should be presented as attributed links and verified before high-stakes use.

These endpoints require internet access. Configure an always-on HTTPS host before relying on webhook delivery.
