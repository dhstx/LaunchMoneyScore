import PDFDocument from 'pdfkit';
import { ScoringResult, CategoryKey } from '../scoring-spec';
import { storagePut } from '../storage';

export interface PDFGenerationResult {
  pdfUrl: string;
  pdfKey: string;
}

/**
 * Generate a comprehensive PDF report with step-by-step improvement guides
 */
export async function generatePDFReport(
  url: string,
  result: ScoringResult
): Promise<PDFGenerationResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        
        // Upload to S3
        const timestamp = Date.now();
        const key = `reports/${timestamp}-lms-report.pdf`;
        const { url: pdfUrl } = await storagePut(key, pdfBuffer, 'application/pdf');

        resolve({ pdfUrl, pdfKey: key });
      });

      // PAGE 1: Executive Summary
      addHeader(doc, 'Launch Money Score Report', 20);
      doc.fontSize(10).fillColor('#666').text(url, { align: 'center' });
      doc.fontSize(8).fillColor('#999').text(`Generated ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(0.8);

      // Compact score cards
      addCompactScores(doc, result);
      doc.moveDown(0.8);

      // Critical gates
      addCriticalGates(doc, result);
      doc.moveDown(0.8);

      // Top 5 fixes
      addTopFixes(doc, result);
      doc.moveDown(0.8);

      // Quick category summary
      addCategorySummary(doc, result);

      // PAGE 2-5: Detailed Guides
      addDetailedGuides(doc, result);

      // Final page: Action plan
      doc.addPage();
      addActionPlan(doc, result);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function addHeader(doc: PDFKit.PDFDocument, title: string, size: number = 16) {
  doc.fontSize(size).fillColor('#4F46E5').text(title, { align: 'center' });
}

function addCompactScores(doc: PDFKit.PDFDocument, result: ScoringResult) {
  doc.fontSize(12).fillColor('#000').text('Overall Scores', { underline: true });
  doc.moveDown(0.3);

  const scores = [
    { label: 'LMS', value: Math.round(result.lms), max: 100 },
    { label: 'RRI', value: Math.round(result.rri), max: 100 },
    { label: 'PMI', value: Math.round(result.pmi), max: 100 },
  ];

  const startY = doc.y;
  scores.forEach((score, i) => {
    const x = 40 + (i * 180);
    doc.fontSize(24).fillColor(getScoreColor(score.value)).text(score.value.toString(), x, startY, { width: 60, align: 'center' });
    doc.fontSize(8).fillColor('#666').text(score.label, x, startY + 30, { width: 60, align: 'center' });
  });
  
  doc.y = startY + 45;
}

function addCriticalGates(doc: PDFKit.PDFDocument, result: ScoringResult) {
  doc.fontSize(12).fillColor('#000').text('Critical Gates', { underline: true });
  doc.moveDown(0.3);

  const failedGates = Object.entries(result.gates).filter(([_, passed]) => !passed);
  
  if (failedGates.length === 0) {
    doc.fontSize(9).fillColor('#059669').text('✓ All gates passed - ready to launch!');
  } else {
    doc.fontSize(9).fillColor('#DC2626').text('⚠ Fix these before launching paid traffic:');
    failedGates.forEach(([gate]) => {
      doc.fontSize(8).fillColor('#000').text(`• ${formatGateName(gate)}`, { indent: 10 });
    });
  }
}

function addTopFixes(doc: PDFKit.PDFDocument, result: ScoringResult) {
  doc.fontSize(12).fillColor('#000').text('Top Priority Fixes', { underline: true });
  doc.moveDown(0.3);

  result.topFixes.slice(0, 5).forEach((fix, i) => {
    doc.fontSize(8).fillColor('#4F46E5').text(`${i + 1}. ${fix}`);
  });
}

function addCategorySummary(doc: PDFKit.PDFDocument, result: ScoringResult) {
  doc.fontSize(12).fillColor('#000').text('Category Scores', { underline: true });
  doc.moveDown(0.3);

  const categories = [
    { key: 'A' as CategoryKey, name: 'Frictionless Flow', max: 20 },
    { key: 'B' as CategoryKey, name: 'Proof-to-Pay', max: 15 },
    { key: 'C' as CategoryKey, name: 'Offer & Pricing', max: 10 },
    { key: 'D' as CategoryKey, name: 'Trust Stack', max: 10 },
    { key: 'E' as CategoryKey, name: 'Traffic Readiness', max: 20 },
    { key: 'F' as CategoryKey, name: 'Performance', max: 10 },
    { key: 'G' as CategoryKey, name: 'Lifecycle', max: 10 },
    { key: 'H' as CategoryKey, name: 'Analytics', max: 5 },
  ];

  categories.forEach((cat) => {
    const score = result.categories[cat.key].score;
    const pct = Math.round((score / cat.max) * 100);
    doc.fontSize(8).fillColor('#000').text(`${cat.key}. ${cat.name}: ${score}/${cat.max} (${pct}%)`);
  });
}

function addDetailedGuides(doc: PDFKit.PDFDocument, result: ScoringResult) {
  const guides = getImprovementGuides();
  
  Object.entries(guides).forEach(([catKey, guide]) => {
    const cat = result.categories[catKey as CategoryKey];
    if (cat.score < cat.maxScore) {
      doc.addPage();
      addCategoryGuide(doc, catKey, guide, cat);
    }
  });
}

function addCategoryGuide(
  doc: PDFKit.PDFDocument,
  catKey: string,
  guide: CategoryGuide,
  catResult: { score: number; maxScore: number; evidence: any }
) {
  // Header
  doc.fontSize(14).fillColor('#4F46E5').text(`${catKey}. ${guide.name}`);
  doc.fontSize(8).fillColor('#666').text(`Score: ${catResult.score}/${catResult.maxScore}`);
  doc.moveDown(0.4);

  // Description
  doc.fontSize(8).fillColor('#000').text(guide.description);
  doc.moveDown(0.5);

  // Improvements
  guide.improvements.forEach((imp) => {
    if (doc.y > 700) doc.addPage();

    doc.fontSize(9).fillColor('#000').text(`✓ ${imp.name}`, { underline: true });
    doc.moveDown(0.2);

    doc.fontSize(7).fillColor('#666').text('Why:', { continued: true });
    doc.fillColor('#000').text(` ${imp.why}`);
    doc.moveDown(0.2);

    doc.fontSize(7).fillColor('#666').text('How to fix:');
    imp.steps.forEach((step) => {
      doc.fontSize(7).fillColor('#000').text(`• ${step}`, { indent: 10 });
    });

    if (imp.tools) {
      doc.moveDown(0.2);
      doc.fontSize(7).fillColor('#666').text('Tools:', { continued: true });
      doc.fillColor('#4F46E5').text(` ${imp.tools}`);
    }

    if (imp.example) {
      doc.moveDown(0.2);
      doc.fontSize(7).fillColor('#666').text('Example:', { continued: true });
      doc.fillColor('#000').text(` ${imp.example}`);
    }

    doc.moveDown(0.4);
  });
}

function addActionPlan(doc: PDFKit.PDFDocument, result: ScoringResult) {
  addHeader(doc, 'Your Action Plan', 16);
  doc.moveDown(0.5);

  const failedGates = Object.entries(result.gates).filter(([_, passed]) => !passed);

  if (failedGates.length > 0) {
    doc.fontSize(10).fillColor('#DC2626').text('🚨 URGENT: Fix Critical Gates First');
    doc.moveDown(0.3);
    failedGates.forEach(([gate], i) => {
      doc.fontSize(8).fillColor('#000').text(`${i + 1}. ${formatGateName(gate)}`);
    });
    doc.moveDown(0.5);
  }

  doc.fontSize(10).fillColor('#059669').text('⚡ Quick Wins (1-2 hours each)');
  doc.moveDown(0.3);
  const quickWins = [
    'Add refund policy to footer and checkout',
    'Enable guest checkout (no account required)',
    'Add Apple Pay/Google Pay buttons',
    'Install Google Analytics tracking',
    'Add email capture before preview',
  ];
  quickWins.forEach((win, i) => {
    doc.fontSize(8).fillColor('#000').text(`${i + 1}. ${win}`);
  });
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor('#4F46E5').text('📈 High-Impact (1-3 days each)');
  doc.moveDown(0.3);
  const highImpact = [
    'Create free preview/demo of your product',
    'Optimize page speed (LCP < 2.5s)',
    'Write 3 SEO landing pages for buyer keywords',
    'Set up abandoned cart email sequence',
    'Launch on Product Hunt or niche community',
  ];
  highImpact.forEach((item, i) => {
    doc.fontSize(8).fillColor('#000').text(`${i + 1}. ${item}`);
  });
  doc.moveDown(0.5);

  doc.fontSize(9).fillColor('#000').text('Timeline:');
  doc.fontSize(8).text('Week 1: Critical gates + quick wins');
  doc.fontSize(8).text('Week 2: High-impact improvements');
  doc.fontSize(8).text('Week 3: Launch marketing campaigns');
  doc.fontSize(8).text('Week 4: Analyze data and iterate');
  doc.moveDown(0.5);

  doc.fontSize(8).fillColor('#666').text('Need help? Email support@launchmoneyscore.com');
  doc.moveDown(1);
  doc.fontSize(7).fillColor('#999').text('Generated by LMS Auditor • https://launchmoneyscore.com', { align: 'center' });
}

interface Improvement {
  name: string;
  why: string;
  steps: string[];
  tools?: string;
  example?: string;
}

interface CategoryGuide {
  name: string;
  description: string;
  improvements: Improvement[];
}

function getImprovementGuides(): Record<string, CategoryGuide> {
  return {
    A: {
      name: 'Frictionless Flow',
      description: 'Every extra click reduces conversions by 10-20%. Make buying effortless.',
      improvements: [
        {
          name: '≤2 clicks to payment',
          why: 'Amazon\'s 1-Click increased conversions 30%',
          steps: [
            'Remove unnecessary pages between product and checkout',
            'Combine shipping and payment into one page',
            'Use Stripe Checkout for instant payment',
          ],
          tools: 'Stripe Checkout: stripe.com/payments/checkout',
        },
        {
          name: 'Guest checkout',
          why: '23% abandon when forced to create account',
          steps: [
            'Add "Continue as Guest" button',
            'Only ask for email, name, payment info',
            'Offer account creation AFTER purchase',
          ],
        },
        {
          name: 'Wallet buttons (Apple Pay / Google Pay)',
          why: 'Wallet users convert 3x faster than card users',
          steps: [
            'Enable in Stripe Dashboard → Settings → Payment Methods',
            'Place buttons ABOVE credit card form',
            'Make buttons prominent (min 44px height)',
          ],
          tools: 'Stripe Payment Element: stripe.com/docs/payments/payment-element',
        },
        {
          name: 'Single CTA above fold',
          why: 'One clear CTA converts 371% better than multiple',
          steps: [
            'Choose ONE primary action (e.g. "Start Free Trial")',
            'Make it the ONLY button above the fold',
            'Use contrasting color',
            'Remove competing links near it',
          ],
          example: 'Good: "Get Your Free Report" | Bad: "Learn More" + "Sign Up" + "Contact"',
        },
        {
          name: 'One-page flow',
          why: 'Multi-page checkouts lose 20% per page',
          steps: [
            'Show preview on same page as purchase button',
            'Use modal/overlay for checkout',
            'Keep user on your domain throughout',
          ],
        },
      ],
    },
    B: {
      name: 'Proof-to-Pay',
      description: 'Free previews increase conversions 2-5x. Show value before asking for payment.',
      improvements: [
        {
          name: 'Free preview',
          why: 'Users won\'t buy what they can\'t see',
          steps: [
            'Generate limited version for free (e.g. first 2 pages, watermarked output)',
            'Show preview immediately (no email required)',
            'Preview should load in <10 seconds',
            'Add "Unlock Full Version" button on preview',
          ],
          example: 'Canva shows watermarked designs | Grammarly shows first 5 corrections',
        },
        {
          name: 'Full artifact gated',
          why: 'If everything is free, no reason to pay',
          steps: [
            'Free: Preview, limited features, watermarked',
            'Paid: Full resolution, all features, no watermark',
            'Show what they\'re missing with blur/lock icons',
          ],
        },
        {
          name: 'Fast preview (≤10s)',
          why: '40% abandon if preview takes >10 seconds',
          steps: [
            'Optimize preview generation (use caching)',
            'Show loading indicator with progress',
            'Generate server-side, not client-side',
            'Use CDN for preview assets',
          ],
          tools: 'Cloudflare CDN: cloudflare.com',
        },
      ],
    },
    C: {
      name: 'Offer & Pricing',
      description: 'Transparent pricing increases conversions 25%. Clear offers reduce friction.',
      improvements: [
        {
          name: 'Micro-pricing (≤$49)',
          why: 'Prices under $50 have 80% less friction',
          steps: [
            'Price between $9-$49',
            'Use psychological pricing: $29 not $30',
            'Show value: "$29 one-time (save 10 hours)"',
          ],
        },
        {
          name: 'Clear refund policy',
          why: 'Money-back guarantees increase conversions 15-30%',
          steps: [
            'Add to checkout page: "30-Day Money-Back Guarantee"',
            'Explain process: "Email us, get refund in 48 hours"',
            'Add trust badge/icon',
            'Include in footer of every page',
          ],
          example: '"Not satisfied? Full refund within 30 days. Email support@yourdomain.com"',
        },
        {
          name: 'Launch promo',
          why: 'Limited-time offers increase conversions 40%',
          steps: [
            'Add banner: "Launch Special: 20% off - 3 days left"',
            'Use countdown timer',
            'Show savings: $49 → $29 "Save $20"',
          ],
          tools: 'Stripe Coupons for discounts',
        },
        {
          name: 'Transparent pricing page',
          why: 'Hidden pricing loses 70% of users',
          steps: [
            'Create /pricing page',
            'Show price WITHOUT requiring signup',
            'List what\'s included',
            'Add FAQ: "Is this a subscription?" "Can I get refund?"',
          ],
        },
      ],
    },
    D: {
      name: 'Trust Signals',
      description: 'Trust signals increase conversions 42%. Build credibility fast.',
      improvements: [
        {
          name: 'Social proof',
          why: '92% trust peer recommendations',
          steps: [
            'Add 3-5 customer testimonials to homepage',
            'Include: Photo, name, company, result',
            'Use real quotes (not generic)',
            'Show usage stats: "Join 10,000+ users"',
          ],
          example: '"Saved me 5 hours. Worth it!" - John Smith, Designer at Acme',
        },
        {
          name: 'Plain Privacy/ToS',
          why: 'Legal jargon scares users',
          steps: [
            'Create /privacy and /terms pages',
            'Use simple language (8th grade level)',
            'Add summary: "We don\'t sell your data"',
            'Link from footer',
          ],
          tools: 'Generator: termsfeed.com',
        },
        {
          name: 'Fast support',
          why: 'Live chat increases conversions 20%',
          steps: [
            'Add live chat widget (Tawk.to is free)',
            'Or show: "Email us - reply in <2 hours"',
            'Add FAQ page',
          ],
          tools: 'Tawk.to (free): tawk.to | Crisp: crisp.chat',
        },
        {
          name: 'Real contact info',
          why: 'Anonymous sites feel scammy',
          steps: [
            'Add /contact page',
            'Show: Email, business name, location',
            'Add founder photo/bio',
          ],
        },
      ],
    },
    E: {
      name: 'Traffic Readiness',
      description: 'SEO and marketing drive 80% of traffic. Get found by buyers.',
      improvements: [
        {
          name: '3 SEO pages',
          why: 'Bottom-funnel keywords convert 10x better',
          steps: [
            'Create pages for: "[Tool] alternative", "Best [tool] for [use case]"',
            'Include: Clear CTA, pricing, demo',
            'Optimize title/meta description',
          ],
          tools: 'Keywords: ahrefs.com/keyword-generator',
        },
        {
          name: 'Search ads',
          why: 'Paid ads give instant traffic',
          steps: [
            'Create Google Ads account: ads.google.com',
            'Target bottom-funnel keywords',
            'Budget: $10-20/day to start',
            'Track conversions',
          ],
        },
        {
          name: 'Community launch',
          why: 'Product Hunt launches get 1000+ visitors',
          steps: [
            'Choose: Product Hunt, Reddit, Indie Hackers, or Hacker News',
            'Engage first (comment, help others)',
            'Launch with story: "I built X to solve Y"',
            'Offer launch discount',
          ],
          tools: 'Product Hunt: producthunt.com/ship',
        },
        {
          name: 'Email capture',
          why: '70% don\'t buy on first visit',
          steps: [
            'Add email field before showing preview',
            'Send abandoned cart reminder (24h later)',
            'Use Mailchimp or ConvertKit',
          ],
          tools: 'Mailchimp (free): mailchimp.com',
        },
        {
          name: 'Schema markup',
          why: 'Rich snippets increase CTR 30%',
          steps: [
            'Add JSON-LD schema to <head>',
            'Include: Product name, price, rating',
            'Test: search.google.com/test/rich-results',
          ],
          tools: 'Generator: technicalseo.com/tools/schema-markup-generator',
        },
      ],
    },
    F: {
      name: 'Performance & Mobile',
      description: '1 second delay = 7% conversion loss. Mobile = 60% of traffic.',
      improvements: [
        {
          name: 'LCP < 2.5s',
          why: 'Slow sites lose 53% of mobile users',
          steps: [
            'Test: pagespeed.web.dev',
            'Optimize images (use WebP, compress with TinyPNG)',
            'Use CDN (Cloudflare)',
            'Minimize JavaScript',
          ],
          tools: 'PageSpeed: pagespeed.web.dev | TinyPNG: tinypng.com',
        },
        {
          name: 'INP < 200ms',
          why: 'Laggy sites feel broken',
          steps: [
            'Reduce JavaScript execution time',
            'Debounce input handlers',
            'Test on slow devices',
          ],
        },
        {
          name: 'CLS < 0.1',
          why: 'Jumpy layouts frustrate users',
          steps: [
            'Set width/height on images and videos',
            'Reserve space for ads/embeds',
            'Don\'t inject content above existing content',
          ],
        },
        {
          name: 'Tap targets ≥44×44px',
          why: '47% struggle with small buttons',
          steps: [
            'Make buttons at least 44×44px',
            'Add padding: padding: 12px 24px',
            'Test on real phone',
          ],
        },
        {
          name: 'Mobile-friendly',
          why: '60% of searches are mobile',
          steps: [
            'Test: search.google.com/test/mobile-friendly',
            'Add viewport meta tag',
            'Use responsive design',
          ],
        },
      ],
    },
    G: {
      name: 'Lifecycle & Recovery',
      description: 'Recover 10-30% of lost sales with email and retargeting.',
      improvements: [
        {
          name: 'Abandoned cart emails',
          why: '70% of carts abandoned, emails recover 10-15%',
          steps: [
            'Send 3 emails: 1h ("You left something"), 24h ("10% off"), 72h ("Last chance 20% off")',
            'Include: Product image, CTA, discount code',
            'Use Mailchimp or Klaviyo',
          ],
          tools: 'Klaviyo: klaviyo.com | Mailchimp: mailchimp.com',
        },
        {
          name: 'Referral program',
          why: 'Referrals convert 4x better',
          steps: [
            'Add to thank-you page: "Share and get $10 credit"',
            'Generate unique referral link',
            'Offer reward when referral converts',
          ],
        },
        {
          name: 'Retargeting pixel',
          why: 'Retargeting converts 2-3x better than cold traffic',
          steps: [
            'Install Facebook Pixel: facebook.com/business',
            'Create audience: "Visited but didn\'t buy"',
            'Run retargeting ads',
          ],
        },
      ],
    },
    H: {
      name: 'Analytics & Iteration',
      description: 'Data-driven sites improve 2x faster. Track what matters.',
      improvements: [
        {
          name: 'Funnel events',
          why: 'Can\'t improve what you don\'t measure',
          steps: [
            'Install Google Analytics 4: analytics.google.com',
            'Track: page_view, view_preview, begin_checkout, purchase',
            'Add event tracking code to each step',
          ],
        },
        {
          name: 'A/B testing',
          why: 'Testing increases conversions 20-50%',
          steps: [
            'Use Google Optimize (free) or Vercel A/B testing',
            'Test one thing at a time: headline, CTA, pricing',
            'Run for 100+ conversions',
          ],
        },
        {
          name: 'Error monitoring',
          why: 'Bugs lose sales',
          steps: [
            'Install Sentry: sentry.io',
            'Track JavaScript errors and API failures',
            'Fix errors within 24 hours',
          ],
          tools: 'Sentry: sentry.io | LogRocket: logrocket.com',
        },
      ],
    },
  };
}

function formatGateName(gate: string): string {
  const names: Record<string, string> = {
    events_wired: 'Analytics events not tracking',
    has_preview: 'No free preview available',
    'lcp_<4s': 'Page load speed too slow (LCP > 4s)',
    payments_on_mobile: 'Payments broken on mobile',
    refund_policy_visible: 'Refund policy missing',
  };
  return names[gate] || gate.replace(/_/g, ' ');
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#059669';
  if (score >= 70) return '#D97706';
  return '#DC2626';
}



/**
 * Generate LMS-Ready badge embed code for sites with LMS >= 85
 */
export function generateBadgeCode(lms: number, url: string): string | null {
  if (lms < 85) return null;

  const badgeUrl = `https://launchmoneyscore.com/badge/${lms}`;
  const embedCode = `<!-- LMS-Ready Badge -->
<a href="https://launchmoneyscore.com?ref=${encodeURIComponent(url)}" target="_blank" rel="noopener">
  <img src="${badgeUrl}" alt="LMS Score: ${lms}" width="150" height="50" />
</a>`;

  return embedCode;
}

