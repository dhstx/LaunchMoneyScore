/**
 * Analytics event tracking service
 * Logs events to the built-in analytics endpoint
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

const ANALYTICS_ENDPOINT = process.env.VITE_ANALYTICS_ENDPOINT;
const WEBSITE_ID = process.env.VITE_ANALYTICS_WEBSITE_ID;

/**
 * Track an analytics event
 */
export async function trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
  if (!ANALYTICS_ENDPOINT || !WEBSITE_ID) {
    console.warn('[Analytics] Analytics not configured');
    return;
  }

  try {
    const payload: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        website_id: WEBSITE_ID,
      },
      timestamp: new Date(),
    };

    // In production, this would send to your analytics service
    // For now, just log it
    console.log('[Analytics]', event, properties);

    // Example: Send to analytics endpoint
    // await fetch(ANALYTICS_ENDPOINT, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // });
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}

/**
 * Track page view
 */
export async function trackPageView(path: string, properties?: Record<string, any>): Promise<void> {
  return trackEvent('view_page', { path, ...properties });
}

/**
 * Predefined event trackers for LMS Auditor
 */
export const analytics = {
  viewHome: () => trackEvent('view_home'),
  scoreStart: (url: string) => trackEvent('score_start', { url }),
  scoreDone: (url: string, lms: number, rri: number, pmi: number) =>
    trackEvent('score_done', { url, lms, rri, pmi }),
  checkoutOpen: (auditId: string, reportId: string) =>
    trackEvent('checkout_open', { auditId, reportId }),
  purchaseComplete: (reportId: string, amount: number) =>
    trackEvent('purchase_complete', { reportId, amount }),
  pdfDownloaded: (reportId: string) =>
    trackEvent('pdf_downloaded', { reportId }),
};

