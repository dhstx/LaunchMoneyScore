import { chromium, Browser, Page } from 'playwright';

export interface PlaywrightCheckResult {
  clicksToPay: number | null;
  guestCheckoutAvailable: boolean;
  walletsVisible: boolean;
  singleCtaAboveFold: boolean;
  previewPresent: boolean;
  previewGated: boolean;
  refundPolicyVisible: boolean;
  privacyTosVisible: boolean;
  socialProofPresent: boolean;
  tapTargetsPassed: boolean;
  mobileResponsive: boolean;
  schemaPresent: boolean;
  emailCapturePresent: boolean;
  error?: string;
}

/**
 * Run headless browser checks with Playwright
 * @param url - The URL to analyze
 */
export async function runPlaywrightChecks(url: string): Promise<PlaywrightCheckResult> {
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Run all checks in parallel
    const [
      clicksToPay,
      guestCheckoutAvailable,
      walletsVisible,
      singleCtaAboveFold,
      previewPresent,
      previewGated,
      refundPolicyVisible,
      privacyTosVisible,
      socialProofPresent,
      tapTargetsPassed,
      mobileResponsive,
      schemaPresent,
      emailCapturePresent,
    ] = await Promise.all([
      checkClicksToPay(page),
      checkGuestCheckout(page),
      checkWallets(page),
      checkSingleCta(page),
      checkPreview(page),
      checkPreviewGated(page),
      checkRefundPolicy(page),
      checkPrivacyTos(page),
      checkSocialProof(page),
      checkTapTargets(page),
      checkMobileResponsive(page),
      checkSchema(page),
      checkEmailCapture(page),
    ]);

    await browser.close();

    return {
      clicksToPay,
      guestCheckoutAvailable,
      walletsVisible,
      singleCtaAboveFold,
      previewPresent,
      previewGated,
      refundPolicyVisible,
      privacyTosVisible,
      socialProofPresent,
      tapTargetsPassed,
      mobileResponsive,
      schemaPresent,
      emailCapturePresent,
    };
  } catch (error: any) {
    if (browser) await browser.close();
    console.error('[Playwright] Error running checks:', error.message);
    return {
      clicksToPay: null,
      guestCheckoutAvailable: false,
      walletsVisible: false,
      singleCtaAboveFold: false,
      previewPresent: false,
      previewGated: false,
      refundPolicyVisible: false,
      privacyTosVisible: false,
      socialProofPresent: false,
      tapTargetsPassed: false,
      mobileResponsive: false,
      schemaPresent: false,
      emailCapturePresent: false,
      error: error.message || 'Failed to run Playwright checks',
    };
  }
}

async function checkClicksToPay(page: Page): Promise<number | null> {
  try {
    // Look for primary CTA buttons
    const ctaSelectors = [
      'button:has-text("Buy")',
      'button:has-text("Get Started")',
      'button:has-text("Try")',
      'button:has-text("Purchase")',
      'a:has-text("Buy")',
      'a:has-text("Get Started")',
      '[data-testid*="cta"]',
      '.cta-button',
      '#cta',
    ];

    for (const selector of ctaSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        let clicks = 0;
        await button.click({ timeout: 5000 });
        clicks++;

        // Wait and check if we reached a payment page
        await page.waitForTimeout(2000);
        const paymentIndicators = [
          'stripe',
          'checkout',
          'payment',
          'cart',
          '/pay',
          'paypal',
          'apple pay',
          'google pay',
        ];
        
        const currentUrl = page.url().toLowerCase();
        const bodyText = (await page.textContent('body') || '').toLowerCase();
        
        if (paymentIndicators.some(indicator => 
          currentUrl.includes(indicator) || bodyText.includes(indicator)
        )) {
          return clicks;
        }

        // Try clicking one more time if needed
        const nextButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Checkout")').first();
        if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await nextButton.click({ timeout: 5000 });
          clicks++;
          await page.waitForTimeout(2000);
          
          const newUrl = page.url().toLowerCase();
          const newBodyText = (await page.textContent('body') || '').toLowerCase();
          
          if (paymentIndicators.some(indicator => 
            newUrl.includes(indicator) || newBodyText.includes(indicator)
          )) {
            return clicks;
          }
        }

        return clicks > 2 ? null : clicks;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function checkGuestCheckout(page: Page): Promise<boolean> {
  try {
    const guestIndicators = ['guest checkout', 'continue as guest', 'checkout without account', 'skip registration'];
    const bodyText = (await page.textContent('body') || '').toLowerCase();
    return guestIndicators.some(indicator => bodyText.includes(indicator));
  } catch {
    return false;
  }
}

async function checkWallets(page: Page): Promise<boolean> {
  try {
    const walletSelectors = [
      '[aria-label*="Apple Pay"]',
      '[aria-label*="Google Pay"]',
      'button:has-text("Apple Pay")',
      'button:has-text("Google Pay")',
      '.apple-pay-button',
      '.google-pay-button',
      '[data-testid*="apple-pay"]',
      '[data-testid*="google-pay"]',
    ];

    for (const selector of walletSelectors) {
      if (await page.locator(selector).first().isVisible({ timeout: 1000 }).catch(() => false)) {
        return true;
      }
    }

    // Check for Payment Request API signals
    const hasPaymentRequest = await page.evaluate(() => {
      return typeof window.PaymentRequest !== 'undefined';
    });

    return hasPaymentRequest;
  } catch {
    return false;
  }
}

async function checkSingleCta(page: Page): Promise<boolean> {
  try {
    const viewportHeight = 667; // Mobile viewport
    const buttons = await page.locator('button, a[href*="buy"], a[href*="get-started"], a[href*="try"]').all();
    
    let visibleCtaCount = 0;
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box && box.y < viewportHeight) {
        const text = await button.textContent();
        if (text && /buy|get started|try|purchase|sign up/i.test(text)) {
          visibleCtaCount++;
        }
      }
    }

    return visibleCtaCount === 1;
  } catch {
    return false;
  }
}

async function checkPreview(page: Page): Promise<boolean> {
  try {
    const previewIndicators = ['preview', 'demo', 'try it', 'sample', 'free trial'];
    const bodyText = (await page.textContent('body') || '').toLowerCase();
    return previewIndicators.some(indicator => bodyText.includes(indicator));
  } catch {
    return false;
  }
}

async function checkPreviewGated(page: Page): Promise<boolean> {
  try {
    const gateIndicators = ['unlock', 'upgrade to download', 'premium', 'pro version', 'full access'];
    const bodyText = (await page.textContent('body') || '').toLowerCase();
    return gateIndicators.some(indicator => bodyText.includes(indicator));
  } catch {
    return false;
  }
}

async function checkRefundPolicy(page: Page): Promise<boolean> {
  try {
    const refundSelectors = [
      'a:has-text("Refund")',
      'a:has-text("Money Back")',
      '[href*="refund"]',
      '[href*="money-back"]',
    ];

    for (const selector of refundSelectors) {
      if (await page.locator(selector).first().isVisible({ timeout: 1000 }).catch(() => false)) {
        return true;
      }
    }

    const bodyText = (await page.textContent('body') || '').toLowerCase();
    return /refund policy|money.back guarantee|30.day refund/i.test(bodyText);
  } catch {
    return false;
  }
}

async function checkPrivacyTos(page: Page): Promise<boolean> {
  try {
    const legalSelectors = [
      'a:has-text("Privacy")',
      'a:has-text("Terms")',
      '[href*="privacy"]',
      '[href*="terms"]',
    ];

    for (const selector of legalSelectors) {
      if (await page.locator(selector).first().isVisible({ timeout: 1000 }).catch(() => false)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

async function checkSocialProof(page: Page): Promise<boolean> {
  try {
    const proofIndicators = ['testimonial', 'review', 'customer', 'trusted by', 'used by'];
    const bodyText = (await page.textContent('body') || '').toLowerCase();
    return proofIndicators.some(indicator => bodyText.includes(indicator));
  } catch {
    return false;
  }
}

async function checkTapTargets(page: Page): Promise<boolean> {
  try {
    const buttons = await page.locator('button, a').all();
    let failedCount = 0;
    let totalCount = 0;

    for (const button of buttons.slice(0, 20)) { // Sample first 20
      const box = await button.boundingBox();
      if (box) {
        totalCount++;
        if (box.width < 24 || box.height < 24) {
          failedCount++;
        }
      }
    }

    return totalCount > 0 && failedCount / totalCount < 0.2; // Allow 20% failure rate
  } catch {
    return false;
  }
}

async function checkMobileResponsive(page: Page): Promise<boolean> {
  try {
    const hasViewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta !== null;
    });

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });

    return hasViewportMeta && !hasHorizontalScroll;
  } catch {
    return false;
  }
}

async function checkSchema(page: Page): Promise<boolean> {
  try {
    const hasSchema = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      return scripts.length > 0;
    });

    return hasSchema;
  } catch {
    return false;
  }
}

async function checkEmailCapture(page: Page): Promise<boolean> {
  try {
    const emailInputs = await page.locator('input[type="email"]').all();
    return emailInputs.length > 0;
  } catch {
    return false;
  }
}

