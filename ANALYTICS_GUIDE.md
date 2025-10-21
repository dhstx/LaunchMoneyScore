# Analytics & Admin Dashboard Guide

## Overview

The LMS Auditor now includes comprehensive analytics tracking and an admin dashboard to monitor user behavior, conversion rates, and revenue metrics.

## What's Tracked

### Audit Analytics
Every audit automatically captures:
- **URL audited** - The website being analyzed
- **IP Address** - For unique user counting
- **User Agent** - Browser and device information
- **Referrer** - Where the user came from
- **UTM Parameters** - Campaign tracking (utm_source, utm_medium, utm_campaign)
- **Timestamps** - When audit started and completed
- **Status** - pending, running, completed, or failed
- **Scores** - LMS, RRI, PMI results

### Purchase Tracking
For each report purchase:
- **Audit ID** - Links purchase to original audit
- **Amount Paid** - Revenue in cents
- **Payment Intent ID** - Stripe transaction reference
- **Paid At** - Timestamp of successful payment
- **User ID** - If user is logged in

## Admin Dashboard

### Access
- **URL:** `/admin`
- **Requirements:** Admin role (set in database)
- **Visible to:** Only users with `role = 'admin'` in the users table

### Dashboard Sections

#### 1. Stats Overview
Four key metrics displayed as cards:
- **Total Audits** - All-time audit count + today's audits
- **Total Revenue** - Lifetime revenue + today's purchases
- **Conversion Rate** - Percentage of audits that convert to purchases
- **Unique Users** - Distinct users (by IP/user ID) + registered users

#### 2. Conversion Funnel
Visual funnel showing drop-off at each stage:
1. **Audits Started** - Users who initiated an audit
2. **Audits Completed** - Audits that finished successfully
3. **Checkout Initiated** - Users who clicked "Get Full Report"
4. **Purchases Completed** - Successful payments

Each stage shows:
- Absolute count
- Percentage of previous stage
- Visual progress bar

#### 3. Recent Audits Tab
Table showing last 50 audits with:
- URL (clickable to open in new tab)
- Status badge (completed/pending/failed)
- LMS score
- Purchase status (Yes/No badge)
- Date created
- Traffic source (UTM or referrer)

#### 4. Purchases Tab
Table showing last 50 purchases with:
- URL audited
- Amount paid ($29.00)
- LMS score achieved
- Purchase date
- User email (if available)

#### 5. Analytics Tab
Traffic source analysis showing:
- Source name (Direct, Google, Facebook, etc.)
- Number of audits from that source
- Number of purchases
- Conversion rate (%)
- Total revenue

## Key Metrics Explained

### Conversion Rate
```
Conversion Rate = (Total Purchases / Total Audits) × 100
```

**Benchmarks:**
- **2-5%** - Industry average for SaaS tools
- **5-10%** - Good performance
- **10%+** - Excellent performance

**Optimization tips:**
- If <2%: Focus on value proposition, pricing, or trust signals
- Track which sources have highest conversion
- A/B test pricing, copy, and CTA placement

### Funnel Drop-off Analysis

**Stage 1 → 2 (Audits Started → Completed)**
- **Expected:** 80-90% completion rate
- **If lower:** Check for technical errors, slow API responses, or timeout issues

**Stage 2 → 3 (Completed → Checkout Initiated)**
- **Expected:** 20-40% click-through
- **If lower:** Improve value communication, add social proof, or enhance preview

**Stage 3 → 4 (Checkout → Purchase)**
- **Expected:** 60-80% completion
- **If lower:** Simplify checkout, add trust badges, or offer payment plans

### Traffic Source Performance

Compare conversion rates across sources:
- **Direct traffic** - Usually highest intent, best conversion
- **Organic search** - High intent, good conversion
- **Social media** - Lower intent, needs nurturing
- **Paid ads** - Should convert well if targeting is right

**Action items:**
- Double down on high-converting sources
- Improve landing pages for low-converting sources
- Track ROI: Revenue per source / Cost per source

## Setting Up Admin Access

### 1. Promote a User to Admin

**Option A: Direct Database Update**
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

**Option B: Through Database UI**
1. Open your database management tool
2. Find the `users` table
3. Locate your user by email
4. Change `role` from `user` to `admin`

### 2. Access the Dashboard
1. Log in to LMS Auditor
2. Navigate to `/admin` or click "Admin" in footer
3. View real-time analytics and reports

## UTM Campaign Tracking

### Setting Up Campaigns

Add UTM parameters to your marketing links:

**Format:**
```
https://launchmoneyscore.com/?utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=CAMPAIGN
```

**Examples:**

**Reddit Launch:**
```
https://launchmoneyscore.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch
```

**Product Hunt:**
```
https://launchmoneyscore.com/?utm_source=producthunt&utm_medium=listing&utm_campaign=launch
```

**Google Ads:**
```
https://launchmoneyscore.com/?utm_source=google&utm_medium=cpc&utm_campaign=website-audit
```

**Email Newsletter:**
```
https://launchmoneyscore.com/?utm_source=newsletter&utm_medium=email&utm_campaign=week1
```

### Tracking Campaign Performance

In the **Analytics Tab**, you'll see:
- Which campaigns drive the most traffic
- Which campaigns convert best
- Revenue per campaign

**Use this to:**
- Identify best-performing channels
- Calculate ROI per campaign
- Optimize ad spend

## Monitoring Best Practices

### Daily Checks
- Total audits today
- Purchases today
- Any failed audits (investigate errors)
- Conversion rate trend

### Weekly Reviews
- Traffic source performance
- Funnel drop-off points
- Revenue vs. target
- User feedback patterns

### Monthly Analysis
- Month-over-month growth
- Campaign ROI
- Feature usage patterns
- Churn indicators

## Optimization Strategies

### If Audits Are Low
1. Increase marketing efforts
2. Post in more communities
3. Run paid ads
4. Improve SEO

### If Conversion Rate Is Low
1. Add testimonials and social proof
2. Improve free preview value
3. Test different pricing
4. Simplify checkout flow
5. Add money-back guarantee (already have 30-day)

### If Checkout Abandonment Is High
1. Reduce friction in email capture
2. Add trust badges to checkout
3. Offer payment plans
4. Send abandoned cart emails (future feature)

## Data Export

### Manual Export
Currently, data can be exported by:
1. Viewing the admin dashboard
2. Using browser dev tools to copy table data
3. Direct database queries

### Future Enhancements
- CSV export buttons
- Automated daily/weekly email reports
- Custom date range filters
- Cohort analysis
- Revenue forecasting

## Privacy & Compliance

### Data Collected
- IP addresses (anonymized after 90 days)
- User agents (for analytics only)
- Referrers (to track sources)
- UTM parameters (for campaign tracking)

### GDPR Compliance
- Users can request data deletion
- IP addresses are not shared with third parties
- Data is used only for analytics and service improvement

### Data Retention
- Audit data: 90 days (unless purchased)
- Purchase data: 1 year
- Analytics aggregates: Indefinitely (anonymized)

## Troubleshooting

### Dashboard Not Loading
1. Verify you're logged in
2. Check your user role is 'admin'
3. Check browser console for errors
4. Verify database connection

### Missing Analytics Data
1. Check if audits are completing successfully
2. Verify database schema is up to date (`pnpm db:push`)
3. Check server logs for errors

### Incorrect Conversion Rate
1. Verify all purchases are marked `isPaid = true`
2. Check for duplicate audit records
3. Ensure timestamps are accurate

## Support

For issues with analytics or the admin dashboard:
- Check server logs: `pnpm logs`
- Review database: Check `audit_runs` and `reports` tables
- Contact: support@launchmoneyscore.com

---

**Remember:** Analytics are only as good as the actions you take based on them. Review regularly, test hypotheses, and iterate!

