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
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'LETTER',
        bufferPages: true
      });
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

      const pageWidth = 612 - 100; // Letter width minus margins

      // PAGE 1: Executive Summary
      doc.fontSize(22).fillColor('#4F46E5').text('Launch Money Score Report', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#666').text(url, { align: 'center' });
      doc.fontSize(9).fillColor('#999').text(`Generated ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Overall Scores - Horizontal Layout
      doc.fontSize(14).fillColor('#000').text('Overall Scores');
      doc.moveDown(0.5);

      const scoreY = doc.y;
      const scoreBoxWidth = (pageWidth - 40) / 3;
      
      // LMS
      drawScoreBox(doc, 50, scoreY, scoreBoxWidth, Math.round(result.lms), 'Launch Money Score');
      // RRI
      drawScoreBox(doc, 50 + scoreBoxWidth + 20, scoreY, scoreBoxWidth, Math.round(result.rri), 'Revenue Readiness');
      // PMI
      drawScoreBox(doc, 50 + (scoreBoxWidth + 20) * 2, scoreY, scoreBoxWidth, Math.round(result.pmi), 'Popularity Momentum');

      doc.y = scoreY + 70;
      doc.moveDown(1);

      // Critical Gates
      doc.fontSize(14).fillColor('#000').text('Critical Gates');
      doc.moveDown(0.5);

      const failedGates = Object.entries(result.gates).filter(([_, passed]) => !passed);
      
      if (failedGates.length === 0) {
        doc.fontSize(10).fillColor('#059669').text('✓ All gates passed - ready to launch paid traffic!');
      } else {
        doc.fontSize(10).fillColor('#DC2626').text('⚠ Fix these before launching paid traffic:');
        doc.moveDown(0.3);
        failedGates.forEach(([gate]) => {
          doc.fontSize(9).fillColor('#000').text(`  • ${formatGateName(gate)}`);
        });
      }
      doc.moveDown(1);

      // Top Priority Fixes
      doc.fontSize(14).fillColor('#000').text('Top Priority Fixes');
      doc.moveDown(0.5);

      result.topFixes.slice(0, 5).forEach((fix, i) => {
        doc.fontSize(9).fillColor('#4F46E5').text(`${i + 1}. ${fix}`);
      });
      doc.moveDown(1);

      // Category Summary
      doc.fontSize(14).fillColor('#000').text('Category Breakdown');
      doc.moveDown(0.5);

      const categories = [
        { key: 'A' as CategoryKey, name: 'Frictionless Flow', max: 20 },
        { key: 'B' as CategoryKey, name: 'Proof-to-Pay', max: 15 },
        { key: 'C' as CategoryKey, name: 'Offer & Pricing', max: 10 },
        { key: 'D' as CategoryKey, name: 'Trust Stack', max: 10 },
        { key: 'E' as CategoryKey, name: 'Traffic Readiness', max: 20 },
        { key: 'F' as CategoryKey, name: 'Performance & Mobile', max: 10 },
        { key: 'G' as CategoryKey, name: 'Lifecycle & Recovery', max: 10 },
        { key: 'H' as CategoryKey, name: 'Analytics & Iteration', max: 5 },
      ];

      categories.forEach((cat) => {
        const score = result.categories[cat.key].score;
        const pct = Math.round((score / cat.max) * 100);
        const color = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';
        doc.fontSize(9).fillColor(color).text(`${cat.key}. ${cat.name}: ${score}/${cat.max} (${pct}%)`);
      });

      // PAGE 2+: Detailed Guides
      const guides = getImprovementGuides();
      
      Object.entries(guides).forEach(([catKey, guide]) => {
        const cat = result.categories[catKey as CategoryKey];
        if (cat.score < cat.maxScore) {
          doc.addPage();
          addCategoryGuide(doc, catKey, guide, cat, pageWidth);
        }
      });

      // Final Page: Action Plan
      doc.addPage();
      addActionPlan(doc, result, pageWidth);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawScoreBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  score: number,
  label: string
) {
  const color = score >= 85 ? '#059669' : score >= 70 ? '#D97706' : '#DC2626';
  
  // Box
  doc.rect(x, y, width, 60).stroke('#ddd');
  
  // Score
  doc.fontSize(28).fillColor(color).text(score.toString(), x, y + 10, {
    width: width,
    align: 'center'
  });
  
  // Label
  doc.fontSize(9).fillColor('#666').text(label, x, y + 45, {
    width: width,
    align: 'center'
  });
}

function addCategoryGuide(
  doc: PDFKit.PDFDocument,
  catKey: string,
  guide: CategoryGuide,
  catResult: { score: number; maxScore: number; evidence: any },
  pageWidth: number
) {
  // Header
  doc.fontSize(16).fillColor('#4F46E5').text(`${catKey}. ${guide.name}`);
  doc.fontSize(9).fillColor('#666').text(`Score: ${catResult.score}/${catResult.maxScore}`);
  doc.moveDown(0.5);

  // Description
  doc.fontSize(10).fillColor('#000').text(guide.description);
  doc.moveDown(0.8);

  // Improvements
  guide.improvements.forEach((imp) => {
    if (doc.y > 680) doc.addPage();

    // Improvement name
    doc.fontSize(11).fillColor('#000').text(`✓ ${imp.name}`, { underline: true });
    doc.moveDown(0.3);

    // Why
    doc.fontSize(9).fillColor('#666').text('Why it matters: ', { continued: true });
    doc.fillColor('#000').text(imp.why);
    doc.moveDown(0.4);

    // How to fix
    doc.fontSize(9).fillColor('#666').text('How to fix:');
    doc.moveDown(0.2);
    imp.steps.forEach((step) => {
      doc.fontSize(9).fillColor('#000').text(`  • ${step}`);
    });
    doc.moveDown(0.4);

    // Tools
    if (imp.tools) {
      doc.fontSize(9).fillColor('#666').text('Tools: ', { continued: true });
      doc.fillColor('#4F46E5').text(imp.tools);
      doc.moveDown(0.3);
    }

    // Example
    if (imp.example) {
      doc.fontSize(9).fillColor('#666').text('Example: ', { continued: true });
      doc.fillColor('#000').text(imp.example);
      doc.moveDown(0.3);
    }

    doc.moveDown(0.5);
  });
}

function addActionPlan(doc: PDFKit.PDFDocument, result: ScoringResult, pageWidth: number) {
  doc.fontSize(18).fillColor('#4F46E5').text('Your Action Plan', { align: 'center' });
  doc.moveDown(1);

  const failedGates = Object.entries(result.gates).filter(([_, passed]) => !passed);

  if (failedGates.length > 0) {
    doc.fontSize(12).fillColor('#DC2626').text('🚨 URGENT: Fix Critical Gates First');
    doc.moveDown(0.4);
    failedGates.forEach(([gate], i) => {
      doc.fontSize(10).fillColor('#000').text(`${i + 1}. ${formatGateName(gate)}`);
    });
    doc.moveDown(0.8);
  }

  doc.fontSize(12).fillColor('#059669').text('⚡ Quick Wins (1-2 hours each)');
  doc.moveDown(0.4);
  const quickWins = [
    'Add refund policy to footer and checkout page',
    'Enable guest checkout (no account required)',
    'Add Apple Pay/Google Pay wallet buttons',
    'Install Google Analytics event tracking',
    'Add email capture before showing preview',
  ];
  quickWins.forEach((win, i) => {
    doc.fontSize(10).fillColor('#000').text(`${i + 1}. ${win}`);
  });
  doc.moveDown(0.8);

  doc.fontSize(12).fillColor('#4F46E5').text('📈 High-Impact Improvements (1-3 days each)');
  doc.moveDown(0.4);
  const highImpact = [
    'Create free preview/demo of your product',
    'Optimize page load speed (target LCP < 2.5s)',
    'Write 3 SEO landing pages targeting buyer keywords',
    'Set up abandoned cart email recovery sequence',
    'Launch on Product Hunt or relevant niche community',
  ];
  highImpact.forEach((item, i) => {
    doc.fontSize(10).fillColor('#000').text(`${i + 1}. ${item}`);
  });
  doc.moveDown(0.8);

  doc.fontSize(11).fillColor('#000').text('Recommended Timeline:');
  doc.moveDown(0.3);
  doc.fontSize(10).text('Week 1: Fix critical gates + complete quick wins');
  doc.fontSize(10).text('Week 2: Implement high-impact improvements');
  doc.fontSize(10).text('Week 3: Launch marketing campaigns and ads');
  doc.fontSize(10).text('Week 4: Analyze data, iterate, and optimize');
  doc.moveDown(1);

  doc.fontSize(10).fillColor('#666').text('Need help? Email support@launchmoneyscore.com');
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#999').text('Generated by LMS Auditor • https://launchmoneyscore.com', { align: 'center' });
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
      description: 'Every extra click reduces conversions by 10-20%. Streamline your checkout to make buying effortless.',
      improvements: [
        {
          name: '≤2 clicks to payment',
          why: 'Amazon\'s 1-Click ordering increased conversions by 30%. Users abandon complex checkouts.',
          steps: [
            'Remove unnecessary pages between product view and checkout',
            'Combine shipping and payment into a single page',
            'Use Stripe Checkout or PayPal for instant payment processing',
            'Test: Can users go from homepage to checkout in 2 clicks?',
          ],
          tools: 'Stripe Checkout (stripe.com/payments/checkout), PayPal Smart Buttons',
        },
        {
          name: 'Guest checkout enabled',
          why: '23% of users abandon carts when forced to create an account. Guest checkout can increase conversions by 45%.',
          steps: [
            'Add prominent "Continue as Guest" button on checkout page',
            'Only require email, name, and payment information',
            'Offer optional account creation AFTER successful purchase',
            'Display message: "Complete your order in 30 seconds - no account needed"',
          ],
        },
        {
          name: 'Wallet payment buttons (Apple Pay / Google Pay)',
          why: 'Apple Pay users convert 3x faster than card users. 50% of mobile users prefer digital wallets.',
          steps: [
            'Enable Apple Pay in Stripe Dashboard → Settings → Payment Methods',
            'Google Pay automatically appears for Android users with Stripe',
            'Place wallet buttons ABOVE the credit card form',
            'Ensure buttons are prominent (minimum 44px height for mobile)',
          ],
          tools: 'Stripe Payment Element (stripe.com/docs/payments/payment-element)',
        },
        {
          name: 'Single clear CTA above the fold',
          why: 'Sites with one clear call-to-action convert 371% better than those with multiple competing CTAs.',
          steps: [
            'Identify your ONE primary action (e.g., "Start Free Trial", "Get Your Report")',
            'Make it the ONLY prominent button visible above the fold',
            'Use high-contrast color that stands out from your design',
            'Remove or de-emphasize competing links and buttons near your CTA',
          ],
          example: 'Good: "Get Your Free Report" (one button). Bad: "Learn More" + "Sign Up" + "Contact Us" (confusing)',
        },
        {
          name: 'One-page preview-to-pay flow',
          why: 'Multi-page checkouts lose 20% of users per additional page. Keep everything on one screen.',
          steps: [
            'Show product preview/demo on the same page as the purchase button',
            'Use modal overlay or embedded form for checkout (don\'t navigate away)',
            'Implement Stripe Checkout embedded mode or Payment Element',
            'Keep users on your domain throughout the entire flow',
          ],
        },
      ],
    },
    B: {
      name: 'Proof-to-Pay',
      description: 'Free previews increase conversions by 2-5x. Users need to see value before they\'ll pay.',
      improvements: [
        {
          name: 'Free preview available',
          why: 'Users won\'t buy what they can\'t see or try. Previews build trust and demonstrate value.',
          steps: [
            'Generate a limited version of your product for free (e.g., first 2 pages of PDF, 10 results, watermarked design)',
            'Show preview immediately without requiring email signup',
            'Ensure preview loads in under 10 seconds on 4G mobile',
            'Add clear "Unlock Full Version" or "Get Complete Report" button on preview',
          ],
          example: 'Canva shows watermarked designs before purchase. Grammarly shows first 5 grammar corrections for free.',
        },
        {
          name: 'Full artifact properly gated',
          why: 'If everything is free, there\'s no incentive to pay. Gate premium features behind payment.',
          steps: [
            'Free tier: Preview, limited features, watermarked output, sample data',
            'Paid tier: Full resolution, all features, no watermark, complete data',
            'Visually show what they\'re missing with blur effects or lock icons',
            'Include side-by-side "Free vs. Pro" comparison',
          ],
        },
        {
          name: 'Preview loads in ≤10 seconds',
          why: '40% of users abandon if preview takes longer than 10 seconds. Speed equals trust.',
          steps: [
            'Optimize preview generation with server-side caching',
            'Show animated loading indicator with progress percentage',
            'Generate previews server-side, not in the browser',
            'Use CDN (Cloudflare) to serve preview assets quickly',
            'Test on throttled 4G mobile connection',
          ],
          tools: 'Cloudflare CDN (cloudflare.com), Vercel Edge Functions for fast generation',
        },
      ],
    },
    C: {
      name: 'Offer & Pricing',
      description: 'Transparent pricing increases conversions by 25%. Clear, compelling offers reduce friction.',
      improvements: [
        {
          name: 'Micro-pricing (≤$49)',
          why: 'Prices under $50 have 80% less purchase friction. Users don\'t need approval for small amounts.',
          steps: [
            'Price your product between $9-$49 for maximum conversion',
            'Use psychological pricing: $29 instead of $30',
            'Frame value: "$29 one-time payment (not $9/month forever)"',
            'Consider tiered pricing: $19 Basic, $29 Pro, $49 Premium',
          ],
          example: 'Good: "$29 one-time payment". Better: "$29 (saves you 10 hours of work)"',
        },
        {
          name: 'Clear refund policy',
          why: 'Money-back guarantees increase conversions by 15-30% by reducing perceived risk.',
          steps: [
            'Add refund policy prominently to checkout page',
            'Display: "30-Day Money-Back Guarantee" with badge/icon',
            'Explain the process: "Email us within 30 days, get refund in 48 hours"',
            'Include refund policy link in footer of every page',
          ],
          example: '"Not satisfied? Get a full refund within 30 days, no questions asked. Email support@yourdomain.com"',
        },
        {
          name: 'Launch promo visible',
          why: 'Limited-time offers create urgency. "Sale ends in 3 days" increases conversions by 40%.',
          steps: [
            'Add banner at top: "Launch Special: 20% off - Ends in 3 days"',
            'Include countdown timer showing hours/minutes remaining',
            'Show original price crossed out: $49 → $29',
            'Highlight savings: "Save $20 today"',
          ],
          tools: 'Stripe Coupons for discount codes, React Countdown for timers',
        },
        {
          name: 'Transparent pricing page',
          why: 'Hidden pricing loses 70% of potential customers. Clear pricing builds trust.',
          steps: [
            'Create dedicated /pricing page',
            'Show exact price WITHOUT requiring signup or contact',
            'List everything included in the price',
            'Add FAQ section: "Is this a subscription?" "Can I get a refund?" "What\'s included?"',
            'Link to pricing page from homepage navigation',
          ],
          example: 'See stripe.com/pricing or notion.so/pricing for good examples',
        },
      ],
    },
    D: {
      name: 'Trust Signals',
      description: 'Trust signals increase conversions by 42%. Build credibility fast with social proof and transparency.',
      improvements: [
        {
          name: 'Social proof visible',
          why: '92% of consumers trust peer recommendations over advertising. Testimonials increase conversions by 34%.',
          steps: [
            'Add 3-5 customer testimonials to homepage',
            'Include: Customer photo, full name, company, specific result',
            'Use real, specific quotes (not generic "Great product!")',
            'Display logos of well-known customers or partners',
            'Show usage stats: "Join 10,000+ satisfied customers"',
          ],
          example: '"This tool saved me 5 hours and paid for itself immediately!" - John Smith, Designer at Acme Inc.',
        },
        {
          name: 'Plain-language Privacy/ToS',
          why: 'Complex legal jargon scares users away. Clear policies build trust.',
          steps: [
            'Create /privacy and /terms pages with simple language',
            'Write at 8th grade reading level (use Hemingway Editor)',
            'Add plain-English summary at top: "We don\'t sell your data. We use cookies to improve your experience."',
            'Link to both pages from footer',
            'Include contact email for questions',
          ],
          tools: 'Privacy policy generator: termsfeed.com, ToS generator: termsofservicegenerator.net',
        },
        {
          name: 'Fast support channel',
          why: 'Live chat increases conversions by 20%. Users want instant answers to objections.',
          steps: [
            'Add live chat widget (Tawk.to is free, Crisp and Intercom are premium)',
            'Or display: "Email us - we reply within 2 hours" with response time',
            'Show support hours clearly',
            'Create FAQ page answering common pre-purchase questions',
            'Actually respond quickly (within 2 hours during business hours)',
          ],
          tools: 'Tawk.to (free, tawk.to), Crisp (crisp.chat), Intercom (intercom.com)',
        },
        {
          name: 'Real contact information',
          why: 'Anonymous sites feel like scams. Real contact info builds credibility.',
          steps: [
            'Create /contact page with real information',
            'Display: Business email, company name, location (city/state)',
            'Optional but helpful: Phone number, LinkedIn profile',
            'Add founder photo and brief bio',
            'Link to contact page from footer',
          ],
        },
      ],
    },
    E: {
      name: 'Traffic Readiness',
      description: 'SEO and marketing drive 80% of traffic. Get found by buyers, not just browsers.',
      improvements: [
        {
          name: '3 high-intent SEO pages',
          why: 'Bottom-funnel keywords convert 10x better than top-funnel. Target buyers ready to purchase.',
          steps: [
            'Create pages targeting buyer keywords: "[Your Tool] alternative", "Best [tool] for [use case]", "[Problem] solution"',
            'Include on each page: Clear CTA, pricing, demo/preview, social proof',
            'Optimize title tags and meta descriptions for click-through',
            'Add pages to your sitemap.xml',
          ],
          example: 'If you sell PDF tools: "Adobe Acrobat alternative", "Best PDF editor for Mac", "Compress PDF online free"',
          tools: 'Keyword research: ahrefs.com/keyword-generator, Google Keyword Planner (free)',
        },
        {
          name: 'Bottom-funnel search ads live',
          why: 'Paid ads provide instant traffic to test product-market fit before waiting for SEO.',
          steps: [
            'Create Google Ads account at ads.google.com',
            'Target bottom-funnel keywords with buyer intent',
            'Start with $10-20/day budget ($300/month)',
            'Write compelling ad copy: "[Tool Name] - Try Free | Fast & Easy"',
            'Link ads to dedicated landing page (not homepage)',
            'Set up conversion tracking to measure ROI',
          ],
        },
        {
          name: 'Niche community launch plan',
          why: 'Niche communities drive highly targeted traffic. Product Hunt launches typically get 1000+ visitors.',
          steps: [
            'Identify 1 relevant community: Product Hunt (for tools), Reddit (find your niche subreddit), Indie Hackers, Hacker News',
            'Engage authentically first: Comment, help others, provide value for 1-2 weeks',
            'Launch with compelling story: "I built X to solve Y problem"',
            'Offer special launch discount or early access',
            'Respond to every comment and question within 1 hour',
          ],
          tools: 'Product Hunt Ship (producthunt.com/ship), Reddit (find your niche subreddit)',
        },
        {
          name: 'Email capture before checkout',
          why: '70% of users don\'t buy on first visit. Capture emails to retarget and recover sales.',
          steps: [
            'Add email field before showing preview: "Enter email to see your results"',
            'Or add "Get notified of updates" signup form',
            'Send abandoned cart reminder 24 hours later',
            'Send feature updates and limited-time offers',
            'Use Mailchimp (free) or ConvertKit for email automation',
          ],
          tools: 'Mailchimp (free tier, mailchimp.com), ConvertKit (convertkit.com)',
        },
        {
          name: 'Schema markup present',
          why: 'Schema.org markup helps Google understand your site. Rich snippets increase click-through by 30%.',
          steps: [
            'Add JSON-LD schema to <head> section of your homepage',
            'Include Product schema: name, description, price, rating',
            'Add Organization schema: logo, contact info, social profiles',
            'Test implementation at search.google.com/test/rich-results',
          ],
          tools: 'Schema generator: technicalseo.com/tools/schema-markup-generator',
        },
      ],
    },
    F: {
      name: 'Performance & Mobile',
      description: '1 second delay = 7% conversion loss. Mobile represents 60% of traffic. Speed and mobile optimization are critical.',
      improvements: [
        {
          name: 'LCP < 2.5 seconds',
          why: 'Largest Contentful Paint measures load speed. Slow sites lose 53% of mobile visitors.',
          steps: [
            'Test your site at pagespeed.web.dev to get current LCP score',
            'Optimize images: Convert to WebP format, compress with TinyPNG, add width/height attributes',
            'Use CDN like Cloudflare to serve assets from edge locations',
            'Minimize JavaScript: Remove unused code, defer non-critical scripts',
            'Enable browser caching with proper cache headers',
          ],
          tools: 'PageSpeed Insights (pagespeed.web.dev), TinyPNG (tinypng.com), Cloudflare CDN',
        },
        {
          name: 'INP < 200ms',
          why: 'Interaction to Next Paint measures responsiveness. Laggy interactions make sites feel broken.',
          steps: [
            'Reduce JavaScript execution time on main thread',
            'Debounce input handlers (wait for user to stop typing)',
            'Use Web Workers for heavy computations',
            'Avoid layout thrashing (batch DOM reads and writes)',
            'Test on slower devices (not just your MacBook Pro)',
          ],
        },
        {
          name: 'CLS < 0.1',
          why: 'Cumulative Layout Shift measures visual stability. Jumpy layouts frustrate users and cause misclicks.',
          steps: [
            'Set explicit width and height attributes on all images and videos',
            'Reserve space for ads and embeds before they load',
            'Never inject content above existing content',
            'Use CSS aspect-ratio property for responsive media',
            'Preload fonts to prevent text shifting',
          ],
        },
        {
          name: 'Mobile tap targets ≥44×44px',
          why: '47% of users struggle with small buttons on mobile. Apple requires 44×44pt minimum.',
          steps: [
            'Make all buttons and links at least 44×44 pixels',
            'Add padding to buttons: padding: 12px 24px',
            'Increase touch area using ::before pseudo-element if needed',
            'Test on real phone (not just browser DevTools)',
            'Add spacing between clickable elements (minimum 8px)',
          ],
        },
        {
          name: 'Mobile-friendly test passes',
          why: 'Google penalizes non-mobile sites in search rankings. 60% of searches happen on mobile.',
          steps: [
            'Test at search.google.com/test/mobile-friendly',
            'Use responsive design (not separate mobile site)',
            'Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">',
            'Use relative units (%, rem, em) instead of fixed pixels',
            'Test on multiple real devices (iPhone, Android)',
          ],
          tools: 'Mobile-Friendly Test (search.google.com/test/mobile-friendly), BrowserStack for device testing',
        },
      ],
    },
    G: {
      name: 'Lifecycle & Recovery',
      description: 'Recover 10-30% of lost sales with email automation and retargeting. Most revenue comes after the first visit.',
      improvements: [
        {
          name: 'Abandoned cart emails',
          why: '70% of carts are abandoned. Recovery emails convert 10-15% of them into sales.',
          steps: [
            'Capture email before checkout begins',
            'Send 3-email sequence: 1 hour ("You left something"), 24 hours ("10% off"), 72 hours ("Last chance - 20% off")',
            'Include: Product image, clear CTA button, discount code',
            'Use Mailchimp, Klaviyo, or ConvertKit for automation',
          ],
          example: 'Subject: "Complete your order - 10% off inside". Body: "Hi [Name], You were about to get [Product]. Use code SAVE10 for 10% off."',
          tools: 'Klaviyo (klaviyo.com), Mailchimp Abandoned Cart (mailchimp.com/features/abandoned-cart)',
        },
        {
          name: 'Post-purchase referral program',
          why: 'Referrals have 4x higher conversion rates than other channels. Incentives increase sharing by 300%.',
          steps: [
            'Add to thank-you page: "Share with a friend and get $10 credit"',
            'Generate unique referral link for each customer',
            'Offer reward: "$10 off your next purchase" or "20% off"',
            'Track referrals in database and attribute conversions',
            'Automatically send reward when referral makes purchase',
          ],
          tools: 'ReferralCandy (referralcandy.com), or build custom with Stripe Coupons',
        },
        {
          name: 'Retargeting pixel installed',
          why: 'Retargeting ads convert 2-3x better than cold traffic. Show ads to people who already visited.',
          steps: [
            'Install Facebook Pixel: Go to facebook.com/business, create pixel, add code to <head>',
            'Or install Google Ads remarketing tag',
            'Create custom audience: "Visited site but didn\'t purchase"',
            'Run retargeting ad campaigns showing your product',
            'Start with $5-10/day budget',
          ],
          tools: 'Facebook Pixel (facebook.com/business/tools/meta-pixel), Google Ads Remarketing',
        },
        {
          name: 'Onboarding email sequence',
          why: 'Engaged users buy more and refer others. Welcome series increases lifetime value by 33%.',
          steps: [
            'Send welcome email immediately after signup',
            'Day 2: "How to get started" with tutorial',
            'Day 5: "Pro tips" with advanced features',
            'Day 10: "Upgrade offer" with discount code',
            'Include: Tips, use cases, support link in every email',
          ],
        },
      ],
    },
    H: {
      name: 'Analytics & Iteration',
      description: 'You can\'t improve what you don\'t measure. Data-driven sites improve 2x faster than those flying blind.',
      improvements: [
        {
          name: 'Funnel events wired',
          why: 'Track every step of your funnel to identify where users drop off and what to fix first.',
          steps: [
            'Install Google Analytics 4 at analytics.google.com',
            'Track these events: page_view (homepage), view_preview (saw demo), begin_checkout (clicked buy), purchase (completed)',
            'Add event tracking code to each step in your flow',
            'Set up conversion goals in GA4 dashboard',
            'Review funnel weekly to spot drop-off points',
          ],
          tools: 'Google Analytics 4 (analytics.google.com), Plausible (privacy-focused, plausible.io)',
        },
        {
          name: 'A/B testing harness',
          why: 'A/B testing increases conversions by 20-50%. Test headlines, pricing, CTAs, and layouts.',
          steps: [
            'Use Google Optimize (free) or Vercel A/B testing',
            'Test ONE thing at a time: headline, CTA button color, pricing, social proof placement',
            'Run each test until you have 100+ conversions per variant',
            'Implement winner, then test next element',
            'Document all tests and results',
          ],
          tools: 'Google Optimize (optimize.google.com), Vercel A/B testing',
        },
        {
          name: 'KPI dashboard',
          why: 'Dashboards keep you accountable and help spot trends early. Review weekly to stay on track.',
          steps: [
            'Track these KPIs: Visitors, Conversion rate, Revenue, Average order value, Customer acquisition cost',
            'Use Google Analytics dashboard or build custom with Stripe data',
            'Set weekly goals for each metric',
            'Review every Monday morning',
            'Share with team to align on priorities',
          ],
        },
        {
          name: 'Error monitoring',
          why: 'Bugs lose sales silently. 88% of users won\'t return after a bad experience.',
          steps: [
            'Install Sentry at sentry.io for error tracking',
            'Monitor JavaScript errors, API failures, and payment issues',
            'Set up Slack/email alerts for critical errors',
            'Fix errors within 24 hours of detection',
            'Review error trends weekly',
          ],
          tools: 'Sentry (sentry.io), LogRocket (logrocket.com for session replay)',
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
    payments_on_mobile: 'Payments broken on mobile devices',
    refund_policy_visible: 'Refund policy missing or hidden',
  };
  return names[gate] || gate.replace(/_/g, ' ');
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

