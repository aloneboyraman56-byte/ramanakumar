# StudyAI MVP

StudyAI is a student-focused AI SaaS starter: a responsive React + Vite + Tailwind frontend backed by a small Node.js + Express API. The UI is usable in demo mode with no credentials, so you can explore the complete flow before connecting paid services.

## What is included

- Landing page, Login, and Register
- Protected student workspace with responsive desktop sidebar and mobile menu
- Dashboard with study streak, focus progress, continue-learning cards, and free-user ad placeholder
- AI Chat with usage indicator and demo fallback
- AI Notes generator with structured study-sheet output
- PDF → Notes upload flow (10MB validation + extraction integration point)
- Image Studio with a demo visual and OpenAI image integration point
- Premium ₹99/month page with checkout placeholder — no real payment is performed
- Settings, theme preference UI, usage limits, loading states, empty states, and error fallbacks
- Server-only environment variables; no API keys are exposed to the browser

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal in this project folder.
3. Install packages:

   ```bash
   npm install
   ```

   If you use pnpm instead, run `pnpm install`.

4. Create your server environment file:

   ```bash
   copy .env.example server/.env
   ```

   On macOS/Linux use `cp .env.example server/.env`.

5. Open `server/.env` and optionally add `OPENAI_API_KEY`. Keep this file private. Do not rename it to a `VITE_` variable and do not put it in `src/`.
6. Start the frontend and API together:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:5173](http://localhost:5173).

The API health check is available at [http://localhost:8787/api/health](http://localhost:8787/api/health).

## Demo mode vs live integrations

Without an OpenAI key, login/register, chat, notes, and PDF flows use safe local demo responses. Image Studio shows a demo visual when the image endpoint is not configured. This lets you test the product without making paid API calls.

To enable live text and image calls, set `OPENAI_API_KEY` in `server/.env`, then restart the server. The browser only calls your Express API; the OpenAI key stays on the server.

The payment endpoint is intentionally a placeholder at `/api/payment/create-checkout-session`. Add a provider such as Razorpay or Stripe on the server, validate webhooks, and persist subscription status before enabling real checkout. The current Premium button never charges a card.

PDF upload validation is implemented. The next integration step is to add a trusted PDF text extractor in `server/index.js`, then send the extracted text to the existing notes prompt. The ad placeholder is a UI slot ready to be replaced with your chosen ad-network component after approval.

## Useful commands

```bash
npm run dev       # frontend + API in development
npm run build     # production frontend build
npm run server    # API only
npm run preview   # preview the production frontend build
```

Before production: add a real database and hashed-password authentication, server-side sessions, request rate limiting, usage persistence, file scanning/storage, payment webhook verification, and privacy/terms pages.
