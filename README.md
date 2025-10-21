# LMS Auditor

**Launch Money Score Auditor** - A production-ready webapp that computes the Launch Money Score (LMS), Revenue Readiness Index (RRI), and Popularity Momentum Index (PMI) for any public URL.

## Overview

LMS Auditor analyzes websites using real measurements from PageSpeed Insights, Chrome UX Report (CrUX), and Playwright headless checks to determine revenue readiness. It provides actionable insights on:

- **Launch Money Score (LMS)**: Overall readiness to generate revenue
- **Revenue Readiness Index (RRI)**: Conversion funnel optimization
- **Popularity Momentum Index (PMI)**: Organic growth potential

## Features

- ✅ Real-time website auditing with PageSpeed Insights & CrUX API
- ✅ Headless browser checks with Playwright (clicks-to-pay, wallets, mobile UX)
- ✅ Comprehensive scoring system with 8 categories and critical gates
- ✅ Beautiful UI with Radix components and Framer Motion animations
- ✅ Stripe payment integration for $29 detailed reports
- ✅ Automatic PDF & JSON report generation
- ✅ "LMS-Ready" badge for sites scoring 85+
- ✅ Rate limiting and API key authentication
- ✅ Analytics event tracking

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind 4 + Radix UI + Framer Motion
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Database**: MySQL (via Drizzle ORM)
- **Payments**: Stripe Checkout with webhook support
- **Testing**: Playwright for headless checks
- **APIs**: PageSpeed Insights, CrUX, Stripe

## Prerequisites

- Node.js 22+ and pnpm
- MySQL database (or TiDB)
- Google Cloud API key (for PageSpeed Insights & CrUX)
- Stripe account with API keys
- Playwright browsers installed

## Environment Variables

Create a `.env` file with the following keys:

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Google APIs
PSI_API_KEY=your_pagespeed_insights_api_key
CRUX_API_KEY=your_crux_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth (Manus Auth - pre-configured)
JWT_SECRET=auto_generated
VITE_APP_ID=auto_generated
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# App Config
VITE_APP_TITLE=LMS Auditor
VITE_APP_LOGO=/logo.svg
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
pnpm exec playwright install chromium
```

### 2. Setup Database

```bash
pnpm db:push
```

This will create the required tables:
- `users` - User authentication
- `audit_runs` - Audit execution records
- `reports` - Purchased report records
- `api_keys` - API key management

### 3. Configure Stripe Webhook

For local development:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

For production, add webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `payment_intent.succeeded`

### 4. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## Project Structure

```
lms-auditor/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── lib/           # tRPC client
├── server/                # Backend Express + tRPC
│   ├── services/          # Business logic
│   │   ├── pagespeed.ts   # PageSpeed Insights API
│   │   ├── crux.ts        # CrUX API
│   │   ├── playwright-checks.ts  # Headless checks
│   │   ├── scoring-engine.ts     # Score computation
│   │   ├── orchestrator.ts       # Audit orchestration
│   │   ├── stripe-service.ts     # Stripe integration
│   │   ├── pdf-generator.ts      # PDF report generation
│   │   └── analytics.ts          # Event tracking
│   ├── api/               # API routes
│   ├── middleware/        # Rate limiting, etc.
│   ├── routers.ts         # tRPC routers
│   ├── db.ts              # Database helpers
│   └── scoring-spec.ts    # Scoring specification
├── drizzle/               # Database schema
└── README.md
```

## Scoring Specification

The LMS Auditor uses a weighted scoring system across 8 categories:

| Category | Weight | Focus Area |
|----------|--------|------------|
| A | 20 | Frictionless Flow (clicks-to-pay, guest checkout, wallets) |
| B | 15 | Proof→Pay (preview, gated content) |
| C | 10 | Transparent Pricing (refund policy, pricing page) |
| D | 10 | Trust Stack (social proof, privacy/ToS, accessibility) |
| E | 20 | Traffic Readiness (SEO, schema, email capture) |
| F | 10 | Performance (LCP, INP, CLS, mobile) |
| G | 10 | Lifecycle & Recovery (emails, retargeting) |
| H | 5  | Analytics & Iteration (events, monitoring) |

### Critical Gates

Sites must pass these gates to be revenue-ready:
- ✅ Payments work on mobile
- ✅ Has preview/demo available
- ✅ LCP < 4s
- ✅ Refund policy visible
- ✅ Events wired for tracking

### Thresholds

- **LCP**: ≤2.5s (good), <4s (acceptable)
- **INP**: <200ms (good), <500ms (acceptable)
- **CLS**: <0.1 (good), <0.25 (acceptable)
- **Tap Targets**: ≥24×24 CSS px (WCAG 2.2)
- **LMS Badge**: Score ≥85

## API Usage

### Public API Endpoint

```bash
POST /api/trpc/audit.start
Content-Type: application/json

{
  "url": "https://example.com"
}
```

### Rate Limits

- **Free audits**: 5 per hour per IP
- **API keys**: Custom limits per key

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

```bash
pnpm build
pnpm start
```

## Calibration & Tuning

To improve scoring accuracy:

1. **Collect data**: Run audits on 50-200 sites
2. **Track outcomes**: Record real conversion rates, mobile wallet usage
3. **Regress weights**: Adjust category weights based on correlation with outcomes
4. **Update thresholds**: Keep aligned with Web Vitals evolution (INP/CLS changes)
5. **Publish v1.1**: Release updated scoring specification

## Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests

```bash
pnpm test:e2e
```

Test coverage includes:
- Score computation logic
- API endpoint responses
- Stripe webhook handling
- PDF generation

## Monitoring

Track these metrics in production:
- Audit completion rate
- Average audit duration
- Payment conversion rate
- PDF generation success rate
- API error rates

## Troubleshooting

### Common Issues

**Playwright fails to launch**
```bash
pnpm exec playwright install chromium --with-deps
```

**Database connection errors**
- Verify `DATABASE_URL` is correct
- Ensure database is accessible from your network

**Stripe webhook not working**
- Check webhook signature in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` matches
- Ensure endpoint is publicly accessible

**PageSpeed Insights quota exceeded**
- Google provides 25,000 requests/day for free
- Consider caching results or implementing request throttling

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [your-repo-url]
- Email: support@lms-auditor.com

## Acknowledgments

Built with:
- [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Chrome UX Report API](https://developer.chrome.com/docs/crux/api)
- [Playwright](https://playwright.dev/)
- [Stripe](https://stripe.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Ready to audit?** Visit [your-domain.com](https://your-domain.com) to get started!

