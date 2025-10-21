/**
 * LMS Auditor Scoring Specification v1.0
 * 
 * Defines weights, checks, formulas, and gates for Launch Money Score (LMS),
 * Revenue Readiness Index (RRI), and Popularity Momentum Index (PMI).
 */

export const SCORING_SPEC = {
  version: "1.0",
  
  weights: {
    A: 20, // Frictionless Flow
    B: 15, // Proof→Pay
    C: 10, // Transparent Pricing
    D: 10, // Trust Stack
    E: 20, // Traffic Readiness
    F: 10, // Performance
    G: 10, // Lifecycle & Recovery
    H: 5,  // Analytics & Iteration
  },
  
  checks: {
    A: [
      "one_page_flow",
      "guest_checkout",
      "wallets_visible",
      "single_cta_above_fold",
      "<=2_clicks_to_payment"
    ],
    B: [
      "free_preview",
      "full_artifact_gated",
      "watermarked_preview",
      "t2preview_<=10s"
    ],
    C: [
      "price_<=49",
      "refund_policy_visible",
      "timeboxed_promo",
      "transparent_pricing_page"
    ],
    D: [
      "social_proof",
      "plain_privacy_tos",
      "fast_support_channel",
      "real_contact",
      "basic_a11y"
    ],
    E: [
      "3_bofu_pages",
      "bofu_search_ads_live",
      "niche_community_plan",
      "marketplace_listing",
      "email_capture",
      "schema_present"
    ],
    F: [
      "lcp_<2.5s",
      "inp_<200ms",
      "cls_<0.1",
      "tap_target_min",
      "mobile_friendly"
    ],
    G: [
      "abandon_cart_emails",
      "referral_credit",
      "retargeting_pixel",
      "onboarding_emails"
    ],
    H: [
      "events_wired",
      "ab_harness",
      "kpi_dashboard",
      "error_monitoring"
    ]
  },
  
  formulas: {
    LMS: "sum(categories)",
    RRI: "100*(0.35*A/20 + 0.25*B/15 + 0.20*C/10 + 0.20*G/10)",
    PMI: "100*(0.40*E/20 + 0.25*F/10 + 0.20*D/10 + 0.15*H/5)"
  },
  
  gates: [
    "payments_on_mobile",
    "has_preview",
    "lcp_<4s",
    "refund_policy_visible",
    "events_wired"
  ],
  
  thresholds: {
    lcp_good: 2.5,
    lcp_poor: 4.0,
    inp_good: 200,
    inp_poor: 500,
    cls_good: 0.1,
    cls_poor: 0.25,
    tap_target_min: 24, // CSS pixels (WCAG 2.2)
    tap_target_bonus: 44, // iOS HIG / Material 48dp
    lms_badge_threshold: 85,
  }
} as const;

export type CategoryKey = keyof typeof SCORING_SPEC.weights;

export interface CategoryScore {
  category: CategoryKey;
  score: number;
  maxScore: number;
  checks: Record<string, boolean>;
  evidence: string[];
}

export interface ScoringResult {
  lms: number;
  rri: number;
  pmi: number;
  categories: Record<CategoryKey, CategoryScore>;
  gates: Record<string, boolean>;
  topFixes: string[];
  timestamp: Date;
}

