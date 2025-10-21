import { fetchPageSpeedInsights } from './pagespeed';
import { fetchCruxData } from './crux';
import { runPlaywrightChecks } from './playwright-checks';
import { computeScores } from './scoring-engine';
import { ScoringResult } from '../scoring-spec';

export interface OrchestratorConfig {
  psiApiKey: string;
  cruxApiKey: string;
}

/**
 * Main orchestrator that runs all checks and computes scores
 * @param url - The URL to audit
 * @param config - API keys and configuration
 */
export async function runFullAudit(
  url: string,
  config: OrchestratorConfig
): Promise<ScoringResult> {
  console.log(`[Orchestrator] Starting audit for ${url}`);

  // Run all data collection in parallel
  const [pageSpeed, crux, playwright] = await Promise.all([
    fetchPageSpeedInsights(url, config.psiApiKey),
    fetchCruxData(url, config.cruxApiKey),
    runPlaywrightChecks(url),
  ]);

  console.log('[Orchestrator] Data collection complete');

  // Compute scores
  const result = computeScores({
    url,
    pageSpeed,
    crux,
    playwright,
  });

  console.log(`[Orchestrator] Audit complete - LMS: ${result.lms}, RRI: ${result.rri}, PMI: ${result.pmi}`);

  return result;
}

