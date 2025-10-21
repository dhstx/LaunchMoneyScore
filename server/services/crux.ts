import axios from 'axios';

export interface CruxResult {
  lcp: {
    p75: number | null;
    good: number | null;
    needsImprovement: number | null;
    poor: number | null;
  };
  inp: {
    p75: number | null;
    good: number | null;
    needsImprovement: number | null;
    poor: number | null;
  };
  cls: {
    p75: number | null;
    good: number | null;
    needsImprovement: number | null;
    poor: number | null;
  };
  eligible: boolean;
  error?: string;
}

/**
 * Fetch CrUX field data (real user metrics)
 * @param url - The URL to analyze
 * @param apiKey - CrUX API key
 */
export async function fetchCruxData(
  url: string,
  apiKey: string
): Promise<CruxResult> {
  const emptyResult: CruxResult = {
    lcp: { p75: null, good: null, needsImprovement: null, poor: null },
    inp: { p75: null, good: null, needsImprovement: null, poor: null },
    cls: { p75: null, good: null, needsImprovement: null, poor: null },
    eligible: false,
  };

  try {
    // Try URL-level data first
    const response = await axios.post(
      `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`,
      {
        url,
        formFactor: 'PHONE',
      },
      { timeout: 30000 }
    );

    const { record } = response.data;
    if (!record || !record.metrics) {
      return { ...emptyResult, error: 'No CrUX data available for this URL' };
    }

    const extractMetric = (metricKey: string) => {
      const metric = record.metrics[metricKey];
      if (!metric) return { p75: null, good: null, needsImprovement: null, poor: null };

      const percentiles = metric.percentiles || {};
      const histogram = metric.histogram || [];

      const good = histogram[0]?.density || null;
      const needsImprovement = histogram[1]?.density || null;
      const poor = histogram[2]?.density || null;

      return {
        p75: percentiles.p75 || null,
        good,
        needsImprovement,
        poor,
      };
    };

    return {
      lcp: extractMetric('largest_contentful_paint'),
      inp: extractMetric('interaction_to_next_paint'),
      cls: extractMetric('cumulative_layout_shift'),
      eligible: true,
    };
  } catch (error: any) {
    // If URL-level fails, try origin-level
    try {
      const originUrl = new URL(url).origin;
      const response = await axios.post(
        `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`,
        {
          origin: originUrl,
          formFactor: 'PHONE',
        },
        { timeout: 30000 }
      );

      const { record } = response.data;
      if (!record || !record.metrics) {
        return { ...emptyResult, error: 'No CrUX data available for this origin' };
      }

      const extractMetric = (metricKey: string) => {
        const metric = record.metrics[metricKey];
        if (!metric) return { p75: null, good: null, needsImprovement: null, poor: null };

        const percentiles = metric.percentiles || {};
        const histogram = metric.histogram || [];

        const good = histogram[0]?.density || null;
        const needsImprovement = histogram[1]?.density || null;
        const poor = histogram[2]?.density || null;

        return {
          p75: percentiles.p75 || null,
          good,
          needsImprovement,
          poor,
        };
      };

      return {
        lcp: extractMetric('largest_contentful_paint'),
        inp: extractMetric('interaction_to_next_paint'),
        cls: extractMetric('cumulative_layout_shift'),
        eligible: true,
      };
    } catch (originError: any) {
      console.error('[CrUX] Error fetching data:', originError.message);
      return {
        ...emptyResult,
        error: 'CrUX data not available (insufficient traffic)',
      };
    }
  }
}

