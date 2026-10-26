# Welcome to your Lovable project

## Payment verification and deployment

Paid orders remain pending until verification. Never treat a typed payment reference as proof of payment.

- Stripe: orders are created before payment; their payment button adds the exact order ID to the configured payment link. Verification checks merchant link, order ID, buyer email, GBP amount and completed/paid status. Use the same email at checkout and in Stripe.
- Configure `STRIPE_SECRET_KEY` securely with a key from the Stripe account that owns the payment link. No Stripe credentials are currently configured. Without them, orders stay pending.
- Configure `STRIPE_WEBHOOK_SECRET` with the endpoint signing secret from Stripe Webhooks for `/api/public/stripe-webhook`; subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Set up a public deployment before registering that endpoint. Missing or invalid signatures are rejected.
- The order page and admin refresh also reconcile pending Stripe orders via the Stripe API when connected. API fallback searches the most recent 100 sessions for the configured payment link; signed webhooks supply the exact session ID.
- PayPal legacy transfers and Xbox gift cards require staff to check the merchant payment/card directly and enter a verification note. Bank transfer stays unavailable. Stripe manual approval is disabled.
- Verified transactions cannot fulfill multiple orders; key allocation is atomic. Existing historical approvals predate these checks and have not been reverified.
- Accounts use a confirmed sign-in email to match stored orders. No account exists yet, so the signed-in dashboard/admin flow has not been tested end-to-end.

### Keys and configuration

This source archive intentionally does not contain private payment/API credentials or redemption key values. Existing secret values cannot be exported. Configure them securely in the destination environment.

Server-only names: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AXAI_PRO_KEYS`, `AXAI_BASIC_KEYS`. The latter two are JSON arrays of redemption keys. Managed Lovable Cloud service credentials are not available for export; configure credentials belonging to your own destination backend if hosting elsewhere.

Browser configuration names: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. The publishable key is public, but no credential-bearing environment file is included in this archive.

Apply the included database migrations to your destination backend before running the site. Install with `bun install`; start with `bun run dev`. Dependencies and compiled output are excluded from the source archive.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
