import express, { Router } from 'express';
import { handleStripeWebhook } from './stripe-webhook';

export function registerApiRoutes(app: express.Application) {
  const router = Router();

  // Stripe webhook endpoint (must use raw body)
  router.post(
    '/stripe/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );

  app.use('/api', router);
}

