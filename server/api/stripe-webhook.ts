import { Request, Response } from 'express';
import { verifyWebhookSignature } from '../services/stripe-service';
import { getReport, updateReport, getAuditRun } from '../db';
import { generatePDFReport, generateBadgeCode } from '../services/pdf-generator';
import { SCORING_SPEC } from '../scoring-spec';

/**
 * Stripe webhook handler
 * Handles checkout.session.completed events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).send('Missing stripe-signature header');
  }

  try {
    // Verify webhook signature
    const event = verifyWebhookSignature(req.body, signature);

    console.log('[Stripe Webhook] Received event:', event.type);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { reportId, auditId } = session.metadata;

      if (!reportId || !auditId) {
        console.error('[Stripe Webhook] Missing metadata');
        return res.status(400).send('Missing metadata');
      }

      // Get report and audit data
      const report = await getReport(reportId);
      const audit = await getAuditRun(auditId);

      if (!report || !audit) {
        console.error('[Stripe Webhook] Report or audit not found');
        return res.status(404).send('Report or audit not found');
      }

      // Generate PDF
      const result = {
        lms: audit.lms || 0,
        rri: audit.rri || 0,
        pmi: audit.pmi || 0,
        categories: audit.categories as any,
        gates: audit.gates as any,
        topFixes: audit.topFixes as any,
        timestamp: audit.completedAt || new Date(),
      };

      const { pdfUrl, pdfKey } = await generatePDFReport(audit.url, result);

      // Generate JSON export URL (store as JSON in S3)
      const jsonData = JSON.stringify(result, null, 2);
      const { storagePut } = await import('../storage');
      const jsonKey = pdfKey.replace('.pdf', '.json');
      const { url: jsonUrl } = await storagePut(jsonKey, Buffer.from(jsonData), 'application/json');

      // Generate badge code if LMS >= 85
      let badgeCode = null;
      if (result.lms >= SCORING_SPEC.thresholds.lms_badge_threshold) {
        badgeCode = generateBadgeCode(result.lms, audit.url);
      }

      // Update report with files
      await updateReport(reportId, {
        isPaid: true,
        pdfUrl,
        jsonUrl,
        badgeCode,
        stripePaymentIntentId: session.payment_intent,
        amountPaid: session.amount_total,
        currency: session.currency,
        paidAt: new Date(),
      });

      console.log('[Stripe Webhook] Report generated successfully:', reportId);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}

