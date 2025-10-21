import axios from 'axios';

export interface PageSpeedResult {
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  opportunities: Array<{
    title: string;
    description: string;
    savings: string;
  }>;
  error?: string;
}

/**
 * Fetch PageSpeed Insights data (Lighthouse lab data)
 * @param url - The URL to analyze
 * @param apiKey - PSI API key
 */
export async function fetchPageSpeedInsights(
  url: string,
  apiKey: string
): Promise<PageSpeedResult> {
  try {
    const response = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
      params: {
        url,
        key: apiKey,
        category: ['performance', 'accessibility', 'best-practices', 'seo'],
        strategy: 'mobile',
      },
      timeout: 60000, // 60 seconds
    });

    const { lighthouseResult } = response.data;
    const audits = lighthouseResult?.audits || {};
    const categories = lighthouseResult?.categories || {};

    // Extract Core Web Vitals from Lighthouse audits
    const lcp = audits['largest-contentful-paint']?.numericValue || null;
    const inp = audits['interaction-to-next-paint']?.numericValue || null;
    const cls = audits['cumulative-layout-shift']?.numericValue || null;

    // Extract category scores
    const performanceScore = categories.performance?.score ? categories.performance.score * 100 : null;
    const accessibilityScore = categories.accessibility?.score ? categories.accessibility.score * 100 : null;
    const bestPracticesScore = categories['best-practices']?.score ? categories['best-practices'].score * 100 : null;
    const seoScore = categories.seo?.score ? categories.seo.score * 100 : null;

    // Extract opportunities (top suggestions)
    const opportunities = Object.entries(audits)
      .filter(([_, audit]: [string, any]) => audit.details?.type === 'opportunity')
      .map(([key, audit]: [string, any]) => ({
        title: audit.title || key,
        description: audit.description || '',
        savings: audit.displayValue || '',
      }))
      .slice(0, 5);

    return {
      lcp: lcp ? lcp / 1000 : null, // Convert to seconds
      inp: inp || null,
      cls: cls || null,
      performanceScore,
      accessibilityScore,
      bestPracticesScore,
      seoScore,
      opportunities,
    };
  } catch (error: any) {
    console.error('[PageSpeed] Error fetching data:', error.message);
    return {
      lcp: null,
      inp: null,
      cls: null,
      performanceScore: null,
      accessibilityScore: null,
      bestPracticesScore: null,
      seoScore: null,
      opportunities: [],
      error: error.message || 'Failed to fetch PageSpeed Insights data',
    };
  }
}

