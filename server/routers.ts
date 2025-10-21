import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { runFullAudit } from "./services/orchestrator";
import { createAuditRun, updateAuditRun, getAuditRun, getUserAuditRuns, createReport, getReport, updateReport, getDb } from "./db";
import { auditRuns, reports } from "../drizzle/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { checkRateLimit } from "./middleware/rate-limit";
import { randomBytes } from "crypto";
import { createCheckoutSession } from "./services/stripe-service";
import { analytics } from "./services/analytics";

export const appRouter = router({
  system: systemRouter,

  admin: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const db = await getDb();
      if (!db) return null;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const allAudits = await db.select().from(auditRuns);
      const allReports = await db.select().from(reports).where(eq(reports.isPaid, true));

      const auditsToday = allAudits.filter(a => a.createdAt && a.createdAt >= todayStart).length;
      const purchasesToday = allReports.filter(r => r.paidAt && r.paidAt >= todayStart).length;

      const totalRevenue = allReports.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
      const uniqueUsers = new Set(allAudits.map(a => a.userId || a.ipAddress).filter(Boolean)).size;
      const registeredUsers = new Set(allAudits.map(a => a.userId).filter(Boolean)).size;

      return {
        totalAudits: allAudits.length,
        totalPurchases: allReports.length,
        totalRevenue,
        auditsToday,
        purchasesToday,
        uniqueUsers,
        registeredUsers,
      };
    }),

    getRecentAudits: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const db = await getDb();
      if (!db) return null;

      // Get recent audits with purchase status
      const audits = await db
        .select()
        .from(auditRuns)
        .orderBy(desc(auditRuns.createdAt))
        .limit(50);

      const auditIds = audits.map(a => a.id);
      const purchases = await db
        .select()
        .from(reports)
        .where(inArray(reports.auditRunId, auditIds));

      const purchaseMap = new Map(purchases.map(p => [p.auditRunId, p]));

      const auditsWithPurchases = audits.map(audit => ({
        ...audit,
        hasPurchase: purchaseMap.has(audit.id),
      }));

      // Get recent purchases with audit details
      const recentPurchases = await db
        .select()
        .from(reports)
        .where(eq(reports.isPaid, true))
        .orderBy(desc(reports.paidAt))
        .limit(50);

      const purchaseAuditIds = recentPurchases.map(p => p.auditRunId);
      const purchaseAudits = await db
        .select()
        .from(auditRuns)
        .where(inArray(auditRuns.id, purchaseAuditIds));

      const auditMap = new Map(purchaseAudits.map(a => [a.id, a]));

      const purchasesWithDetails = recentPurchases.map(purchase => {
        const audit = auditMap.get(purchase.auditRunId);
        return {
          ...purchase,
          url: audit?.url,
          lms: audit?.lms,
          userEmail: audit?.userId ? 'User' : null,
        };
      });

      // Calculate traffic sources
      const sourceStats = new Map<string, { audits: number; purchases: number; revenue: number }>();
      
      audits.forEach(audit => {
        const source = audit.utmSource || audit.referrer || 'Direct';
        const stats = sourceStats.get(source) || { audits: 0, purchases: 0, revenue: 0 };
        stats.audits++;
        
        const purchase = purchaseMap.get(audit.id);
        if (purchase?.isPaid) {
          stats.purchases++;
          stats.revenue += purchase.amountPaid || 0;
        }
        
        sourceStats.set(source, stats);
      });

      const sources = Array.from(sourceStats.entries()).map(([source, stats]) => ({
        source,
        ...stats,
      }));

      return {
        audits: auditsWithPurchases,
        purchases: purchasesWithDetails,
        sources,
      };
    }),

    getConversionFunnel: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const db = await getDb();
      if (!db) return null;

      const allAudits = await db.select().from(auditRuns);
      const allReports = await db.select().from(reports);

      const auditsStarted = allAudits.length;
      const auditsCompleted = allAudits.filter(a => a.status === 'completed').length;
      const checkoutInitiated = allReports.length;
      const purchasesCompleted = allReports.filter(r => r.isPaid).length;

      return {
        auditsStarted,
        auditsCompleted,
        checkoutInitiated,
        purchasesCompleted,
      };
    }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  audit: router({
    // Start a new audit run
    start: publicProcedure
      .input(z.object({
        url: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit by IP (10 audits per hour)
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || 'unknown';
        checkRateLimit(ip, 10, 60 * 60 * 1000);
        
        // Normalize URL - add https:// if missing
        let normalizedUrl = input.url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = 'https://' + normalizedUrl;
        }
        
        // Validate URL format
        try {
          new URL(normalizedUrl);
        } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid URL format',
          });
        }

        // Extract analytics data
        const ipAddress = ctx.req.ip || ctx.req.socket.remoteAddress || null;
        const userAgent = ctx.req.get('user-agent') || null;
        const referrer = ctx.req.get('referer') || null;
        
        // Extract UTM parameters from referrer if present
        let utmSource = null;
        let utmMedium = null;
        let utmCampaign = null;
        if (referrer) {
          try {
            const refUrl = new URL(referrer);
            utmSource = refUrl.searchParams.get('utm_source');
            utmMedium = refUrl.searchParams.get('utm_medium');
            utmCampaign = refUrl.searchParams.get('utm_campaign');
          } catch {}
        }

        // Create audit run record
        const auditId = randomBytes(16).toString('hex');
        const auditRun = await createAuditRun({
          id: auditId,
          url: normalizedUrl,
          userId: ctx.user?.id || null,
          status: 'pending',
          ipAddress,
          userAgent,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
        });

        // Start audit in background
        (async () => {
          try {
            await updateAuditRun(auditId, { status: 'running' });

            const psiApiKey = process.env.PSI_API_KEY || '';
            const cruxApiKey = process.env.CRUX_API_KEY || '';

            if (!psiApiKey || !cruxApiKey) {
              throw new Error('API keys not configured');
            }

            const result = await runFullAudit(input.url, {
              psiApiKey,
              cruxApiKey,
            });

            const lms = Math.round(result.lms);
            const rri = Math.round(result.rri);
            const pmi = Math.round(result.pmi);

            await updateAuditRun(auditId, {
              status: 'completed',
              lms,
              rri,
              pmi,
              categories: result.categories as any,
              gates: result.gates as any,
              topFixes: result.topFixes as any,
              completedAt: new Date(),
            });

            // Track analytics
            analytics.scoreDone(input.url, lms, rri, pmi).catch(console.error);
          } catch (error: any) {
            console.error('[Audit] Error running audit:', error);
            await updateAuditRun(auditId, {
              status: 'failed',
              error: error.message || 'Unknown error',
            });
          }
        })();

        // Track analytics
        analytics.scoreStart(input.url).catch(console.error);

        return {
          auditId,
          status: 'pending',
        };
      }),

    // Get audit status and results
    get: publicProcedure
      .input(z.object({
        auditId: z.string(),
      }))
      .query(async ({ input }) => {
        const auditRun = await getAuditRun(input.auditId);
        
        if (!auditRun) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Audit not found',
          });
        }

        return {
          id: auditRun.id,
          url: auditRun.url,
          status: auditRun.status,
          lms: auditRun.lms,
          rri: auditRun.rri,
          pmi: auditRun.pmi,
          categories: auditRun.categories,
          gates: auditRun.gates,
          topFixes: auditRun.topFixes,
          error: auditRun.error,
          createdAt: auditRun.createdAt,
          completedAt: auditRun.completedAt,
        };
      }),

    // List user's audit history
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const runs = await getUserAuditRuns(ctx.user.id);
        return runs.map(run => ({
          id: run.id,
          url: run.url,
          status: run.status,
          lms: run.lms,
          rri: run.rri,
          pmi: run.pmi,
          createdAt: run.createdAt,
          completedAt: run.completedAt,
        }));
      }),
  }),

  report: router({
    // Create a report purchase intent and get Stripe checkout URL
    create: publicProcedure
      .input(z.object({
        auditId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const auditRun = await getAuditRun(input.auditId);
        
        if (!auditRun) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Audit not found',
          });
        }

        if (auditRun.status !== 'completed') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Audit not completed yet',
          });
        }

        // Create report record
        const reportId = randomBytes(16).toString('hex');
        await createReport({
          id: reportId,
          auditRunId: input.auditId,
          userId: ctx.user?.id || null,
          isPaid: false,
        });

        // Create Stripe checkout session
        const protocol = ctx.req.protocol || 'https';
        const host = ctx.req.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;

        const checkoutUrl = await createCheckoutSession({
          reportId,
          auditId: input.auditId,
          successUrl: `${baseUrl}/report/${reportId}?success=true`,
          cancelUrl: `${baseUrl}/audit/${input.auditId}`,
        });

        return {
          reportId,
          auditId: input.auditId,
          checkoutUrl,
        };
      }),

    // Get report details
    get: publicProcedure
      .input(z.object({
        reportId: z.string(),
      }))
      .query(async ({ input }) => {
        const report = await getReport(input.reportId);
        
        if (!report) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Report not found',
          });
        }

        return {
          id: report.id,
          auditRunId: report.auditRunId,
          isPaid: report.isPaid,
          pdfUrl: report.pdfUrl,
          jsonUrl: report.jsonUrl,
          badgeCode: report.badgeCode,
          createdAt: report.createdAt,
          paidAt: report.paidAt,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

