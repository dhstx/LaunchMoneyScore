import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }
  return stripeInstance;
}

export interface CreateCheckoutSessionParams {
  reportId: string;
  auditId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout session for report purchase
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    throw new Error('STRIPE_PRICE_ID not configured');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      reportId: params.reportId,
      auditId: params.auditId,
    },
    // Enable wallet buttons
    payment_method_options: {
      card: {
        request_three_d_secure: 'automatic',
      },
    },
    allow_promotion_codes: true, // Enable coupon codes like LAUNCH10
  });

  return session.url || '';
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

