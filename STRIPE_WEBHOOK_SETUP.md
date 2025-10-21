# Stripe Webhook Configuration

## Production Webhook Setup

Now that you have the domain `launchmoneyscore.com`, you need to configure the Stripe webhook endpoint.

### Steps:

1. **Go to Stripe Dashboard**
   - Navigate to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"

2. **Configure Endpoint URL**
   ```
   https://launchmoneyscore.com/api/stripe/webhook
   ```

3. **Select Events to Listen For**
   - `checkout.session.completed`
   - `payment_intent.succeeded`

4. **Get Webhook Signing Secret**
   - After creating the endpoint, Stripe will show you the webhook signing secret
   - It starts with `whsec_...`
   - Update your environment variable: `STRIPE_WEBHOOK_SECRET`

5. **Test the Webhook**
   - Use Stripe's "Send test webhook" feature
   - Or make a test purchase through your site

## Current Webhook Secret

Your current webhook secret is already configured:
```
whsec_HeGde6sfeJF82Hkuep5NsyXdcf8j0mhm
```

**Important:** Make sure this webhook is configured for your production domain `launchmoneyscore.com`, not the development URL.

## Webhook Endpoint Details

**URL:** `https://launchmoneyscore.com/api/stripe/webhook`

**What it does:**
1. Receives payment confirmation from Stripe
2. Generates PDF report with audit results
3. Generates JSON export
4. Creates LMS-Ready badge (if score ≥ 85)
5. Stores files in database
6. Marks report as paid

**Security:**
- Webhook signature verification enabled
- Only processes valid Stripe events
- Prevents replay attacks

## Testing Locally

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a temporary webhook secret starting with `whsec_...` that you can use for testing.

## Troubleshooting

### Webhook Not Receiving Events
1. Check the endpoint URL is correct
2. Verify webhook secret matches in environment variables
3. Check Stripe dashboard for failed webhook attempts
4. Review server logs for errors

### Payment Succeeds But No Report Generated
1. Check webhook endpoint is accessible (not blocked by firewall)
2. Verify database connection
3. Check server logs for PDF generation errors
4. Ensure audit run exists in database

### Webhook Signature Verification Fails
1. Confirm `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
2. Check for extra whitespace in environment variable
3. Verify webhook is configured for the correct Stripe account

## Monitoring

Monitor webhook health in Stripe Dashboard:
- Go to Webhooks → Your endpoint
- View success/failure rate
- See recent webhook attempts
- Review error messages

**Success rate should be >99%**

If you see failures:
1. Click on failed event
2. Review error message
3. Check server logs at that timestamp
4. Fix issue and use "Resend" in Stripe dashboard

