import { SCORING_SPEC, CategoryKey, CategoryScore, ScoringResult } from '../scoring-spec';
import { PageSpeedResult } from './pagespeed';
import { CruxResult } from './crux';
import { PlaywrightCheckResult } from './playwright-checks';

export interface ScoringInput {
  url: string;
  pageSpeed: PageSpeedResult;
  crux: CruxResult;
  playwright: PlaywrightCheckResult;
}

/**
 * Compute LMS, RRI, and PMI scores based on collected data
 */
export function computeScores(input: ScoringInput): ScoringResult {
  const categories: Record<CategoryKey, CategoryScore> = {
    A: computeCategoryA(input),
    B: computeCategoryB(input),
    C: computeCategoryC(input),
    D: computeCategoryD(input),
    E: computeCategoryE(input),
    F: computeCategoryF(input),
    G: computeCategoryG(input),
    H: computeCategoryH(input),
  };

  // Calculate LMS (sum of all categories)
  const lms = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0);

  // Calculate RRI: 100*(0.35*A/20 + 0.25*B/15 + 0.20*C/10 + 0.20*G/10)
  const rri = 100 * (
    0.35 * (categories.A.score / SCORING_SPEC.weights.A) +
    0.25 * (categories.B.score / SCORING_SPEC.weights.B) +
    0.20 * (categories.C.score / SCORING_SPEC.weights.C) +
    0.20 * (categories.G.score / SCORING_SPEC.weights.G)
  );

  // Calculate PMI: 100*(0.40*E/20 + 0.25*F/10 + 0.20*D/10 + 0.15*H/5)
  const pmi = 100 * (
    0.40 * (categories.E.score / SCORING_SPEC.weights.E) +
    0.25 * (categories.F.score / SCORING_SPEC.weights.F) +
    0.20 * (categories.D.score / SCORING_SPEC.weights.D) +
    0.15 * (categories.H.score / SCORING_SPEC.weights.H)
  );

  // Check gates
  const gates = checkGates(input, categories);

  // Generate top fixes
  const topFixes = generateTopFixes(categories, gates);

  return {
    lms: Math.round(lms * 10) / 10,
    rri: Math.round(rri * 10) / 10,
    pmi: Math.round(pmi * 10) / 10,
    categories,
    gates,
    topFixes,
    timestamp: new Date(),
  };
}

function computeCategoryA(input: ScoringInput): CategoryScore {
  const { playwright } = input;
  const maxScore = SCORING_SPEC.weights.A;
  const checksPerPoint = SCORING_SPEC.checks.A.length / maxScore;

  const checks = {
    one_page_flow: (playwright.clicksToPay || 99) <= 1,
    guest_checkout: playwright.guestCheckoutAvailable,
    wallets_visible: playwright.walletsVisible,
    single_cta_above_fold: playwright.singleCtaAboveFold,
    '<=2_clicks_to_payment': (playwright.clicksToPay || 99) <= 2,
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / checksPerPoint) * 10) / 10;

  return {
    category: 'A',
    score: Math.min(score, maxScore),
    maxScore,
    checks,
    evidence: [
      `Clicks to payment: ${playwright.clicksToPay ?? 'Unknown'}`,
      `Guest checkout: ${checks.guest_checkout ? 'Available' : 'Not found'}`,
      `Wallets visible: ${checks.wallets_visible ? 'Yes' : 'No'}`,
      `Single CTA above fold: ${checks.single_cta_above_fold ? 'Yes' : 'No'}`,
    ],
  };
}

function computeCategoryB(input: ScoringInput): CategoryScore {
  const { playwright } = input;
  const maxScore = SCORING_SPEC.weights.B;
  const checksPerPoint = SCORING_SPEC.checks.B.length / maxScore;

  const checks = {
    free_preview: playwright.previewPresent,
    full_artifact_gated: playwright.previewGated,
    watermarked_preview: playwright.previewPresent && playwright.previewGated,
    't2preview_<=10s': playwright.previewPresent, // Assume fast if present
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / checksPerPoint) * 10) / 10;

  return {
    category: 'B',
    score: Math.min(score, maxScore),
    maxScore,
    checks,
    evidence: [
      `Preview present: ${checks.free_preview ? 'Yes' : 'No'}`,
      `Gated content: ${checks.full_artifact_gated ? 'Yes' : 'No'}`,
    ],
  };
}

function computeCategoryC(input: ScoringInput): CategoryScore {
  const { playwright } = input;
  const maxScore = SCORING_SPEC.weights.C;
  const checksPerPoint = SCORING_SPEC.checks.C.length / maxScore;

  const checks = {
    'price_<=49': true, // Would need price extraction
    refund_policy_visible: playwright.refundPolicyVisible,
    timeboxed_promo: false, // Would need detection
    transparent_pricing_page: true, // Assume true for now
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / checksPerPoint) * 10) / 10;

  return {
    category: 'C',
    score: Math.min(score, maxScore),
    maxScore,
    checks,
    evidence: [
      `Refund policy visible: ${checks.refund_policy_visible ? 'Yes' : 'No'}`,
      `Transparent pricing: ${checks.transparent_pricing_page ? 'Yes' : 'No'}`,
    ],
  };
}

function computeCategoryD(input: ScoringInput): CategoryScore {
  const { playwright, pageSpeed } = input;
  const maxScore = SCORING_SPEC.weights.D;
  const checksPerPoint = SCORING_SPEC.checks.D.length / maxScore;

  const checks = {
    social_proof: playwright.socialProofPresent,
    plain_privacy_tos: playwright.privacyTosVisible,
    fast_support_channel: false, // Would need detection
    real_contact: false, // Would need detection
    basic_a11y: (pageSpeed.accessibilityScore || 0) >= 80,
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / checksPerPoint) * 10) / 10;

  return {
    category: 'D',
    score: Math.min(score, maxScore),
    maxScore,
    checks,
    evidence: [
      `Social proof: ${checks.social_proof ? 'Present' : 'Missing'}`,
      `Privacy/ToS visible: ${checks.plain_privacy_tos ? 'Yes' : 'No'}`,
      `Accessibility score: ${pageSpeed.accessibilityScore || 'N/A'}`,
    ],
  };
}

function computeCategoryE(input: ScoringInput): CategoryScore {
  const { playwright } = input;
  const maxScore = SCORING_SPEC.weights.E;
  const checksPerPoint = SCORING_SPEC.checks.E.length / maxScore;

  const checks = {
    '3_bofu_pages': false, // Would need crawling
    bofu_search_ads_live: false, // Would need external check
    niche_community_plan: false, // Would need detection
    marketplace_listing: false, // Would need detection
    email_capture: playwright.emailCapturePresent,
    schema_present: playwright.schemaPresent,
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / checksPerPoint) * 10) / 10;

  return {
    category: 'E',
    score: Math.min(score, maxScore),
    maxScore,
    checks,
    evidence: [
      `Email capture: ${checks.email_capture ? 'Present' : 'Missing'}`,
      `Schema markup: ${checks.schema_present ? 'Present' : 'Missing'}`,
    ],
  };
}

function computeCategoryF(input: ScoringInput): CategoryScore {
  const { pageSpeed, playwright } = input;
  const maxScore = SCORING_SPEC.weights.F;
  const checksPerPoint = SCORING_SPEC.checks.F.length / maxScore;

  const checks = {
    'lcp_<2.5s': (pageSpeed.lcp || 999) < SCORING_SPEC.thresholds.lcp_good,
    'inp_<200ms': (pageSpeed.inp || 999) < SCORING_SPEC.thresholds.inp_good,
    'cls_<0.1': (pageSpeed.cls || 999) < SCORING_SPEC.thresholds.cls_good,
    tap_target_min: playwright.tapTargetsPassed,
    mobile_friendly: playwright.mobileResponsive,
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / checksPerPoint) * 10) / 10;

  return {
    category: 'F',
    score: Math.min(score, maxScore),
    maxScore,
    checks,
    evidence: [
      `LCP: ${pageSpeed.lcp ? `${pageSpeed.lcp.toFixed(2)}s` : 'N/A'}`,
      `INP: ${pageSpeed.inp ? `${pageSpeed.inp.toFixed(0)}ms` : 'N/A'}`,
      `CLS: ${pageSpeed.cls ? pageSpeed.cls.toFixed(3) : 'N/A'}`,
      `Tap targets: ${checks.tap_target_min ? 'Passed' : 'Failed'}`,
      `Mobile responsive: ${checks.mobile_friendly ? 'Yes' : 'No'}`,
    ],
  };
}

function computeCategoryG(input: ScoringInput): CategoryScore {
  const maxScore = SCORING_SPEC.weights.G;
  const checksPerPoint = SCORING_SPEC.checks.G.length / maxScore;

  const checks = {
    abandon_cart_emails: false, // Would need email verification
    referral_credit: false, // Would need detection
    retargeting_pixel: false, // Would need pixel detection
    onboarding_emails: false, // Would need email verification
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / checksPerPoint) * 10) / 10;

  return {
    category: 'G',
    score: Math.min(score, maxScore),
    maxScore,
    checks,
    evidence: [
      'Lifecycle checks require manual verification or snippet integration',
    ],
  };
}

function computeCategoryH(input: ScoringInput): CategoryScore {
  const maxScore = SCORING_SPEC.weights.H;
  const checksPerPoint = SCORING_SPEC.checks.H.length / maxScore;

  const checks = {
    events_wired: false, // Would need snippet verification
    ab_harness: false, // Would need detection
    kpi_dashboard: false, // Would need detection
    error_monitoring: false, // Would need detection
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / checksPerPoint) * 10) / 10;

  return {
    category: 'H',
    score: Math.min(score, maxScore),
    maxScore,
    checks,
    evidence: [
      'Analytics checks require manual verification or snippet integration',
    ],
  };
}

function checkGates(input: ScoringInput, categories: Record<CategoryKey, CategoryScore>): Record<string, boolean> {
  const { pageSpeed, playwright } = input;

  return {
    payments_on_mobile: playwright.walletsVisible || (playwright.clicksToPay || 99) <= 3,
    has_preview: playwright.previewPresent,
    'lcp_<4s': (pageSpeed.lcp || 999) < SCORING_SPEC.thresholds.lcp_poor,
    refund_policy_visible: playwright.refundPolicyVisible,
    events_wired: categories.H.checks.events_wired,
  };
}

function generateTopFixes(categories: Record<CategoryKey, CategoryScore>, gates: Record<string, boolean>): string[] {
  const fixes: Array<{ priority: number; fix: string }> = [];

  // Gate failures are highest priority
  if (!gates.payments_on_mobile) {
    fixes.push({ priority: 1, fix: 'Enable mobile payments (Apple Pay / Google Pay)' });
  }
  if (!gates.has_preview) {
    fixes.push({ priority: 1, fix: 'Add a free preview or demo of your product' });
  }
  if (!gates['lcp_<4s']) {
    fixes.push({ priority: 1, fix: 'Improve page load speed (LCP > 4s is critical)' });
  }
  if (!gates.refund_policy_visible) {
    fixes.push({ priority: 1, fix: 'Display refund policy prominently' });
  }

  // Category-specific fixes
  if (!categories.A.checks.wallets_visible) {
    fixes.push({ priority: 2, fix: 'Add wallet buttons (Apple Pay / Google Pay) to checkout' });
  }
  if (!categories.A.checks.guest_checkout) {
    fixes.push({ priority: 2, fix: 'Enable guest checkout (no account required)' });
  }
  if (!categories.F.checks['lcp_<2.5s']) {
    fixes.push({ priority: 2, fix: 'Optimize Largest Contentful Paint (target < 2.5s)' });
  }
  if (!categories.F.checks['inp_<200ms']) {
    fixes.push({ priority: 2, fix: 'Improve Interaction to Next Paint (target < 200ms)' });
  }
  if (!categories.D.checks.social_proof) {
    fixes.push({ priority: 3, fix: 'Add testimonials or customer logos' });
  }
  if (!categories.E.checks.schema_present) {
    fixes.push({ priority: 3, fix: 'Add structured data (Schema.org markup)' });
  }

  // Sort by priority and return top 5
  return fixes
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)
    .map(f => f.fix);
}

